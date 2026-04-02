import React from 'react';

/**
 * Simple avatar button that directly opens the ProfileModal.
 * No dropdown menu — click → big centered modal.
 */
const ProfileDropdown = ({ user, onLogout, onOpenProfile }) => {
    const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <div className="profile-trigger-wrap">
            <button
                className="profile-trigger-btn"
                onClick={() => onOpenProfile('profile')}
                title="View profile"
                aria-label="Open profile"
            >
                <span className="profile-avatar-initials">{initials}</span>
                <span className="profile-trigger-name">{user?.name?.split(' ')[0]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.5 }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            <button className="navbar-logout-btn" onClick={onLogout} title="Sign out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </button>
        </div>
    );
};

export default ProfileDropdown;
