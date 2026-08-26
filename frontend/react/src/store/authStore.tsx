import React, { createContext, useContext, useCallback, useMemo, useState, ReactNode } from 'react';
import { getInitials, hashColor } from '../features/personalization/greeting';

const AUTH_KEY = 'word.auth';
const USERS_KEY = 'word.users';

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  avatar?: string; // data URL for uploaded profile image
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'email' | 'avatar'>>) => { ok: boolean; error?: string };
  forgotPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthState | null>(null);

/* ── Password storage (frontend-only, not production-secure) ── */

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string; // In production this would be hashed server-side
  avatar?: string;
  createdAt: string;
  resetCode?: string;
  resetExpiry?: number;
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* non-fatal */
  }
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === 'string' && typeof parsed?.email === 'string') {
      return parsed as User;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    /* non-fatal */
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Validate password strength. Returns null if valid, otherwise error message. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
}

/** Validate email format. */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => loadSession());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 400));

    const users = loadUsers();
    const found = users.find((u) => u.email === email.trim().toLowerCase());

    if (!found) {
      setIsLoading(false);
      return { ok: false, error: 'No account found with this email. Please sign up first.' };
    }

    if (found.password !== password) {
      setIsLoading(false);
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }

    const sessionUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      initials: getInitials(found.name),
      color: hashColor(found.email),
      avatar: found.avatar,
      createdAt: found.createdAt,
    };

    setUser(sessionUser);
    saveSession(sessionUser);
    setIsLoading(false);
    return { ok: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      setIsLoading(false);
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (users.some((u) => u.email === normalizedEmail)) {
      setIsLoading(false);
      return { ok: false, error: 'An account with this email already exists. Please log in.' };
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setIsLoading(false);
      return { ok: false, error: pwdError };
    }

    const id = generateId();
    const storedUser: StoredUser = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(storedUser);
    saveUsers(users);

    const sessionUser: User = {
      id,
      name: storedUser.name,
      email: storedUser.email,
      initials: getInitials(storedUser.name),
      color: hashColor(storedUser.email),
      createdAt: storedUser.createdAt,
    };

    setUser(sessionUser);
    saveSession(sessionUser);
    setIsLoading(false);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  const updateProfile = useCallback((data: Partial<Pick<User, 'name' | 'email' | 'avatar'>>): { ok: boolean; error?: string } => {
    if (!user) return { ok: false, error: 'No active account.' };
    const normalizedEmail = data.email?.trim().toLowerCase();
    const users = loadUsers();
    if (normalizedEmail && users.some((u) => u.email === normalizedEmail && u.id !== user.id)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const updated: User = {
      ...user,
      ...(data.name !== undefined ? { name: data.name, initials: getInitials(data.name) } : {}),
      ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
    };
    saveSession(updated);

    // Also update the stored users list
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      if (data.name !== undefined) users[idx].name = data.name;
      if (normalizedEmail !== undefined) users[idx].email = normalizedEmail;
      if (data.avatar !== undefined) users[idx].avatar = data.avatar;
      saveUsers(users);
    }

    setUser(updated);
    return { ok: true };
  }, [user]);

  const forgotPassword = useCallback(async (email: string): Promise<{ ok: boolean; message: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const users = loadUsers();
    const found = users.find((u) => u.email === email.toLowerCase());

    if (!found) {
      setIsLoading(false);
      // Don't reveal whether email exists
      return { ok: true, message: 'If an account exists with that email, a reset code has been sent.' };
    }

    // Generate a simple 6-digit reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    found.resetCode = code;
    found.resetExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    saveUsers(users);

    setIsLoading(false);
    // In production this would send an email
    return { ok: true, message: `Reset code: ${code} (Demo — in production this would be emailed)` };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const users = loadUsers();
    const found = users.find((u) => u.email === email.toLowerCase());

    if (!found || !found.resetCode || found.resetCode !== code) {
      setIsLoading(false);
      return { ok: false, error: 'Invalid reset code.' };
    }

    if (found.resetExpiry && Date.now() > found.resetExpiry) {
      setIsLoading(false);
      return { ok: false, error: 'Reset code has expired. Please request a new one.' };
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setIsLoading(false);
      return { ok: false, error: pwdError };
    }

    found.password = newPassword;
    found.resetCode = undefined;
    found.resetExpiry = undefined;
    saveUsers(users);

    setIsLoading(false);
    return { ok: true };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      updateProfile,
      forgotPassword,
      resetPassword,
    }),
    [user, isLoading, login, signup, logout, updateProfile, forgotPassword, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
