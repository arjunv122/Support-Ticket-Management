import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ProfileModal = ({ user, onClose, initialTab = 'profile' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [profile, setProfile] = useState(null);
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/api/auth/me');
                setProfile(res.data);
            } catch { setProfile(user); }
            finally { setProfileLoading(false); }
        };
        fetchProfile();

        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, []);

    const handlePwChange = async (e) => {
        e.preventDefault();
        setPwError(''); setPwSuccess('');
        if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match'); return; }
        if (pwForm.newPassword.length < 6) { setPwError('New password must be at least 6 characters'); return; }
        setPwLoading(true);
        try {
            await api.put('/api/auth/change-password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword
            });
            setPwSuccess('✅ Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwError(err.response?.data?.message || 'Failed to change password');
        }
        setPwLoading(false);
    };

    const displayUser = profile || user;
    const initials = displayUser?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    const memberSince = displayUser?.createdAt
        ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'N/A';

    return (
        <div className="pm-overlay" onClick={onClose}>
            <div className="pm-card" onClick={e => e.stopPropagation()}>

                {/* ── Decorative top gradient strip ── */}
                <div className="pm-top-strip" />

                {/* ── Close ── */}
                <button className="pm-close" onClick={onClose} aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                {/* ── Header ── */}
                <div className="pm-header">
                    <div className="pm-avatar-wrap">
                        <div className="pm-avatar">{initials}</div>
                        <div className="pm-avatar-ring" />
                    </div>
                    <div className="pm-header-info">
                        <h2 className="pm-name">{displayUser?.name || '—'}</h2>
                        <p className="pm-email">{displayUser?.email || '—'}</p>
                        <span className={`pm-role-chip pm-role-${displayUser?.role?.toLowerCase()}`}>
                            {displayUser?.role === 'AGENT' ? '🛠️ Support Agent' : '👤 Customer'}
                        </span>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="pm-tabs">
                    {['profile', 'security'].map(tab => (
                        <button key={tab} className={`pm-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab === 'profile' ? '👤 Profile' : '🔒 Security'}
                        </button>
                    ))}
                </div>

                {/* ── Body ── */}
                <div className="pm-body">
                    {activeTab === 'profile' && (
                        profileLoading ? (
                            <div className="pm-loading">Loading profile…</div>
                        ) : (
                            <div className="pm-info-grid">
                                {[
                                    { label: 'Full Name',       value: displayUser?.name },
                                    { label: 'Email Address',   value: displayUser?.email },
                                    { label: 'Account Type',    value: displayUser?.role },
                                    { label: 'Member Since',    value: memberSince },
                                    { label: 'User ID',         value: displayUser?._id, mono: true },
                                ].map((item, i) => (
                                    <div key={i} className="pm-info-row">
                                        <span className="pm-info-label">{item.label}</span>
                                        <span className={`pm-info-value ${item.mono ? 'pm-mono' : ''}`}>
                                            {item.value || '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handlePwChange} className="pm-form">
                            <div className="pm-security-intro">
                                <div className="pm-security-icon">🔒</div>
                                <p>Choose a strong password and don't reuse it for other websites.</p>
                            </div>
                            {pwError   && <div className="pm-alert pm-alert-error">⚠️ {pwError}</div>}
                            {pwSuccess && <div className="pm-alert pm-alert-success">{pwSuccess}</div>}

                            {[
                                { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                                { key: 'newPassword',     label: 'New Password',     placeholder: 'Min 6 characters' },
                                { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key} className="pm-field">
                                    <label className="pm-field-label">{label}</label>
                                    <input type="password" required placeholder={placeholder}
                                        className="pm-input"
                                        value={pwForm[key]}
                                        onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} />
                                </div>
                            ))}

                            <button type="submit" className="pm-submit-btn" disabled={pwLoading}>
                                {pwLoading ? (
                                    <span className="pm-btn-inner"><span className="pm-spinner" /> Updating…</span>
                                ) : '🔒 Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
