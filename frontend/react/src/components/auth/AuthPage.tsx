import React, { useState, useRef, useEffect } from 'react';
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, User as UserIcon,
  CheckCircle, XCircle, AlertCircle, FileText, Shield, Zap,
} from 'lucide-react';
import { useAuth, validatePassword, validateEmail } from '../../store/authStore';
import './AuthPage.css';

interface AuthPageProps {
  onBack: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot' | 'reset';

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { login, signup, forgotPassword, resetPassword, user, isLoading } = useAuth();
  const [view, setView] = useState<AuthView>('login');

  /* ── Login ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  /* ── Signup ── */
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupError, setSignupError] = useState('');
  const [showSignupPwd, setShowSignupPwd] = useState(false);

  /* ── Forgot password ── */
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  /* ── Reset password ── */
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPwd, setResetNewPwd] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'signup') nameRef.current?.focus();
    else if (view === 'login') emailRef.current?.focus();
  }, [view]);

  /* ── Password strength indicator ── */
  const pwdStrength = (pwd: string) => {
    const checks = [
      { label: '8+ characters', ok: pwd.length >= 8 },
      { label: 'One uppercase', ok: /[A-Z]/.test(pwd) },
      { label: 'One lowercase', ok: /[a-z]/.test(pwd) },
      { label: 'One number', ok: /[0-9]/.test(pwd) },
    ];
    const passed = checks.filter((c) => c.ok).length;
    return { checks, passed, total: checks.length };
  };

  /* ── Handlers ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      setLoginError('Please fill in all fields.');
      return;
    }

    const result = await login(email, password);
    if (result.ok) {
      onBack();
    } else {
      setLoginError(result.error || 'Login failed.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    const name = signupName.trim();
    const email = signupEmail.trim();
    const password = signupPassword;
    const confirm = signupConfirm;

    if (!name || !email || !password || !confirm) {
      setSignupError('Please fill in all fields.');
      return;
    }

    if (name.length < 2) {
      setSignupError('Name must be at least 2 characters.');
      return;
    }

    if (!validateEmail(email)) {
      setSignupError('Please enter a valid email address.');
      return;
    }

    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setSignupError(pwdErr);
      return;
    }

    if (password !== confirm) {
      setSignupError('Passwords do not match.');
      return;
    }

    const result = await signup(name, email, password);
    if (result.ok) {
      onBack();
    } else {
      setSignupError(result.error || 'Signup failed.');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage('');
    const email = forgotEmail.trim();

    if (!email) {
      setForgotMessage('Please enter your email address.');
      return;
    }

    const result = await forgotPassword(email);
    setForgotSent(true);
    setForgotMessage(result.message);
    setResetEmail(email);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetCode || !resetNewPwd || !resetConfirm) {
      setResetError('Please fill in all fields.');
      return;
    }

    if (resetNewPwd !== resetConfirm) {
      setResetError('Passwords do not match.');
      return;
    }

    const pwdErr = validatePassword(resetNewPwd);
    if (pwdErr) {
      setResetError(pwdErr);
      return;
    }

    const result = await resetPassword(resetEmail, resetCode, resetNewPwd);
    if (result.ok) {
      setResetSuccess(true);
    } else {
      setResetError(result.error || 'Reset failed.');
    }
  };

  const strength = pwdStrength(signupPassword);

  return (
    <div className="auth-overlay">
      <div className="auth-split">
        {/* ── Left: Brand panel ── */}
        <div className="auth-brand">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <img
                src="/logo2.png"
                alt="WORD logo"
                width={23}
                height={30}
                draggable={false}
              />
              <span className="auth-brand-wordmark">WORD</span>
            </div>
            <h2 className="auth-brand-headline">
              Write with clarity.<br />Organize with confidence.
            </h2>
            <p className="auth-brand-desc">
              A professional document editor built for focused writing, 
              smart formatting, and seamless collaboration.
            </p>
            <div className="auth-brand-features">
              <div className="auth-brand-feature">
                <span className="auth-brand-feature-icon">
                  <FileText size={15} strokeWidth={1.8} />
                </span>
                Rich text editing with precision formatting
              </div>
              <div className="auth-brand-feature">
                <span className="auth-brand-feature-icon">
                  <Shield size={15} strokeWidth={1.8} />
                </span>
                Your documents stay private and secure
              </div>
              <div className="auth-brand-feature">
                <span className="auth-brand-feature-icon">
                  <Zap size={15} strokeWidth={1.8} />
                </span>
                Fast, offline-first, no dependencies
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="auth-form-panel">
          {/* Back button */}
          <button className="auth-back" onClick={onBack} title="Back to editor">
            <ArrowLeft size={15} strokeWidth={2.2} />
            Back
          </button>

          <div className="auth-form-container" key={view}>
            {/* ═══════════════════ LOGIN ═══════════════════ */}
            {view === 'login' && (
              <>
                <div className="auth-welcome">Welcome back</div>
                <p className="auth-welcome-sub">Sign in to continue to your documents</p>

                <form className="auth-form" onSubmit={handleLogin}>
                  {loginError && <div className="auth-error"><AlertCircle size={14} />{loginError}</div>}

                  <label className="auth-field">
                    <Mail size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      ref={emailRef}
                      type="email"
                      placeholder="Email address"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      aria-label="Email"
                    />
                  </label>

                  <label className="auth-field">
                    <Lock size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type={showLoginPwd ? 'text' : 'password'}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      className="auth-pwd-toggle"
                      onClick={() => setShowLoginPwd((s) => !s)}
                      tabIndex={-1}
                      aria-label={showLoginPwd ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </label>

                  <div className="auth-row-between">
                    <label className="auth-checkbox">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <button type="button" className="auth-link" onClick={() => setView('forgot')}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className="auth-submit" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>

                  <p className="auth-switch">
                    Don't have an account?{' '}
                    <button type="button" className="auth-link" onClick={() => setView('signup')}>
                      Sign up
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ═══════════════════ SIGNUP ═══════════════════ */}
            {view === 'signup' && (
              <>
                <div className="auth-welcome">Create your account</div>
                <p className="auth-welcome-sub">Start writing with a personalized workspace</p>

                <form className="auth-form" onSubmit={handleSignup}>
                  {signupError && <div className="auth-error"><AlertCircle size={14} />{signupError}</div>}

                  <label className="auth-field">
                    <UserIcon size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      ref={nameRef}
                      type="text"
                      placeholder="Full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      autoComplete="name"
                      aria-label="Full name"
                    />
                  </label>

                  <label className="auth-field">
                    <Mail size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      autoComplete="email"
                      aria-label="Email"
                    />
                  </label>

                  <label className="auth-field">
                    <Lock size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type={showSignupPwd ? 'text' : 'password'}
                      placeholder="Password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      className="auth-pwd-toggle"
                      onClick={() => setShowSignupPwd((s) => !s)}
                      tabIndex={-1}
                      aria-label={showSignupPwd ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </label>

                  {/* Password strength */}
                  {signupPassword && (
                    <div className="auth-strength">
                      <div className="auth-strength-bar">
                        {Array.from({ length: strength.total }, (_, i) => (
                          <div
                            key={i}
                            className={`auth-strength-segment${i < strength.passed ? ' filled' : ''}${strength.passed === strength.total ? ' strong' : ''}`}
                          />
                        ))}
                      </div>
                      <div className="auth-strength-checks">
                        {strength.checks.map((c) => (
                          <span key={c.label} className={`auth-check${c.ok ? ' ok' : ''}`}>
                            {c.ok ? <CheckCircle size={11} /> : <XCircle size={11} />}
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="auth-field">
                    <Lock size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      autoComplete="new-password"
                      aria-label="Confirm password"
                    />
                  </label>

                  <button type="submit" className="auth-submit" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>

                  <p className="auth-switch">
                    Already have an account?{' '}
                    <button type="button" className="auth-link" onClick={() => setView('login')}>
                      Sign in
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ═══════════════════ FORGOT PASSWORD ═══════════════════ */}
            {view === 'forgot' && !forgotSent && (
              <>
                <div className="auth-welcome">Forgot Password</div>
                <p className="auth-welcome-sub">Enter your email and we'll send you a reset code</p>

                <form className="auth-form" onSubmit={handleForgot}>
                  {forgotMessage && <div className="auth-error"><AlertCircle size={14} />{forgotMessage}</div>}

                  <label className="auth-field">
                    <Mail size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoComplete="email"
                      aria-label="Email"
                    />
                  </label>

                  <button type="submit" className="auth-submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                  </button>

                  <button type="button" className="auth-link-centered" onClick={() => setView('login')}>
                    <ArrowLeft size={13} /> Back to Login
                  </button>
                </form>
              </>
            )}

            {/* ═══════════════════ RESET PASSWORD ═══════════════════ */}
            {view === 'forgot' && forgotSent && !resetSuccess && (
              <>
                <div className="auth-welcome">Reset Password</div>
                <p className="auth-welcome-sub">{forgotMessage}</p>

                <form className="auth-form" onSubmit={handleReset}>
                  {resetError && <div className="auth-error"><AlertCircle size={14} />{resetError}</div>}

                  <label className="auth-field">
                    <Mail size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      readOnly
                      aria-label="Email"
                    />
                  </label>

                  <label className="auth-field">
                    <Lock size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type="text"
                      placeholder="6-digit reset code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      maxLength={6}
                      aria-label="Reset code"
                    />
                  </label>

                  <label className="auth-field">
                    <Lock size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type="password"
                      placeholder="New password"
                      value={resetNewPwd}
                      onChange={(e) => setResetNewPwd(e.target.value)}
                      autoComplete="new-password"
                      aria-label="New password"
                    />
                  </label>

                  <label className="auth-field">
                    <Lock size={16} strokeWidth={1.8} className="auth-field-icon" />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                      autoComplete="new-password"
                      aria-label="Confirm new password"
                    />
                  </label>

                  <button type="submit" className="auth-submit" disabled={isLoading}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>

                  <button type="button" className="auth-link-centered" onClick={() => { setForgotSent(false); setView('login'); }}>
                    <ArrowLeft size={13} /> Back to Login
                  </button>
                </form>
              </>
            )}

            {/* ═══════════════════ RESET SUCCESS ═══════════════════ */}
            {resetSuccess && (
              <div className="auth-success">
                <CheckCircle size={44} strokeWidth={1.4} className="auth-success-icon" />
                <div className="auth-success-title">Password Reset</div>
                <p className="auth-success-text">Your password has been updated successfully.</p>
                <button className="auth-submit" onClick={() => { setView('login'); setResetSuccess(false); setForgotSent(false); }}>
                  Sign In
                </button>
              </div>
            )}

            {/* Already logged in indicator */}
            {user && (
              <div className="auth-logged-in">
                <div className="auth-avatar" style={{ background: user.color }}>
                  {user.initials}
                </div>
                <div className="auth-logged-info">
                  <span className="auth-logged-name">Already logged in as {user.name}</span>
                  <span className="auth-logged-email">{user.email}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
