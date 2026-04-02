import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications/my-notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    // Polling setup
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/api/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button className="bell-icon-btn" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown glass">
                    <div className="notif-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={markAllRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="notif-body">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">No alerts right now!</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n._id} 
                                     className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                                     onClick={() => { if(!n.isRead) markAsRead(n._id); }}>
                                    
                                    <div className="notif-icon">
                                        {n.type === 'ASSIGNMENT' ? '📥' : 
                                         n.type === 'MENTION' ? '💬' : 
                                         n.type === 'SLA_BREACH' ? '🚨' : '🔔'}
                                    </div>
                                    <div className="notif-content">
                                        <p>{n.message}</p>
                                        <span className="notif-time">
                                            {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    {!n.isRead && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
