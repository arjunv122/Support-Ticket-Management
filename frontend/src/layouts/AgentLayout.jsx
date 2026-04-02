import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import ProfileModal from '../components/ProfileModal';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import './AgentLayout.css';

const AgentLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileModalTab, setProfileModalTab] = useState(null);
    const [urgentCount, setUrgentCount] = useState(0);

    useEffect(() => {
        const fetchUrgent = async () => {
            try {
                const res = await api.get('/api/tickets/assigned');
                const tickets = res.data;
                const count = tickets.filter(t => t.priority === 'URGENT' && t.status === 'OPEN').length;
                setUrgentCount(count);
            } catch (err) { console.error(err); }
        };
        fetchUrgent();
        // optionally refresh every 30s
        const t = setInterval(fetchUrgent, 30000);
        return () => clearInterval(t);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="agent-layout-wrapper">
            {profileModalTab && <ProfileModal user={user} onClose={() => setProfileModalTab(null)} initialTab={profileModalTab} />}
            <Sidebar />
            <div className="agent-main-content">
                <nav className="navbar">
                    <h1 className="navbar-brand" style={{ fontSize: '1.25rem' }}>TicketFlow <span style={{fontWeight: 400, opacity: 0.8}}>Enterprise</span></h1>
                    <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {urgentCount > 0 && (
                            <span className="urgent-badge" title={`${urgentCount} urgent open ticket(s)`} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>
                                🔴 {urgentCount} Urgent
                            </span>
                        )}
                        <ThemeToggle />
                        <NotificationBell />
                        <ProfileDropdown
                            user={user}
                            onLogout={handleLogout}
                            onOpenProfile={(tab) => setProfileModalTab(tab)}
                        />
                    </div>
                </nav>
                <Outlet />
            </div>
        </div>
    );
};

export default AgentLayout;
