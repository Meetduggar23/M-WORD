import React, { useEffect, useRef } from 'react';
import { User, Settings, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../../store/authStore';
import './ProfileDropdown.css';

interface ProfileDropdownProps {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onOpenProfile, onOpenSettings, onClose,
}) => {
  const { user, logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!user) return null;

  return (
    <div className="profile-dropdown" ref={ref} role="menu" aria-label="Account menu">
      {/* User info */}
      <div className="pd-user">
        <div className="pd-avatar" style={{ background: user.color }}>
          {user.initials}
        </div>
        <div className="pd-user-info">
          <span className="pd-name">{user.name}</span>
          <span className="pd-email">{user.email}</span>
        </div>
      </div>

      <div className="pd-sep" />

      {/* Actions */}
      <button className="pd-item" role="menuitem" onClick={() => { onOpenProfile(); onClose(); }}>
        <User size={14} strokeWidth={1.9} />
        Profile
      </button>
      <button className="pd-item" role="menuitem" onClick={() => { onOpenSettings(); onClose(); }}>
        <Settings size={14} strokeWidth={1.9} />
        Settings
      </button>
      <button className="pd-item" role="menuitem" onClick={() => { onClose(); }}>
        <Sun size={14} strokeWidth={1.9} />
        Appearance
      </button>

      <div className="pd-sep" />

      <button className="pd-item pd-logout" role="menuitem" onClick={() => { logout(); onClose(); }}>
        <LogOut size={14} strokeWidth={1.9} />
        Logout
      </button>
    </div>
  );
};
