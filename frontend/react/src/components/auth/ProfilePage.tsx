import React, { useState, useRef } from 'react';
import {
  X, Camera, Trash2, User as UserIcon, Mail, LogOut, ArrowLeft,
} from 'lucide-react';
import { useAuth, validateEmail } from '../../store/authStore';
import './ProfilePage.css';

interface ProfilePageProps {
  onClose: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSave = () => {
    setError('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    updateProfile({ name: trimmedName, email: trimmedEmail });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    updateProfile({ avatar: undefined });
  };

  return (
    <div className="profile-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-card" role="dialog" aria-modal="true" aria-label="Profile">
        {/* Header */}
        <div className="pf-header">
          <button className="pf-back" onClick={onClose}>
            <ArrowLeft size={16} strokeWidth={2.2} />
          </button>
          <h2 className="pf-title">Profile</h2>
          <button className="pf-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Avatar */}
        <div className="pf-avatar-section">
          <div className="pf-avatar-wrap">
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" className="pf-avatar-img" />
            ) : (
              <div className="pf-avatar" style={{ background: user.color }}>
                {user.initials}
              </div>
            )}
            <button
              className="pf-avatar-edit"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo"
              aria-label="Upload profile photo"
            >
              <Camera size={14} strokeWidth={2} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
          {user.avatar && (
            <button className="pf-remove-avatar" onClick={handleRemoveAvatar}>
              <Trash2 size={12} strokeWidth={2} />
              Remove photo
            </button>
          )}
        </div>

        {/* Form */}
        <div className="pf-form">
          {error && <div className="pf-error">{error}</div>}
          {saved && <div className="pf-saved">Profile saved!</div>}

          <label className="pf-field">
            <span className="pf-label">
              <UserIcon size={13} strokeWidth={1.9} />
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Name"
            />
          </label>

          <label className="pf-field">
            <span className="pf-label">
              <Mail size={13} strokeWidth={1.9} />
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              aria-label="Email"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="pf-actions">
          <button
            className="pf-save"
            onClick={handleSave}
            disabled={name === user.name && email === user.email}
          >
            Save Changes
          </button>
          <button className="pf-logout" onClick={() => { logout(); onClose(); }}>
            <LogOut size={14} strokeWidth={2} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
