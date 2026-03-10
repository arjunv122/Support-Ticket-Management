import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';
import ImageLightbox from '../components/ImageLightbox';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── SLA Age helper ──────────────────────────────────────────
const getAge = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return { label: `${mins}m ago`, color: '#10b981' };
    if (hours < 24) return { label: `${hours}h ago`, color: hours < 8 ? '#10b981' : '#f59e0b' };
    return { label: `${days}d ago`, color: days < 3 ? '#f59e0b' : '#ef4444' };
};

const AgentDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [allAgents, setAllAgents] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [newAgentId, setNewAgentId] = useState('');
    const [commentText, setCommentText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [lightbox, setLightbox] = useState(null); // { src, alt }

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'AGENT') { navigate('/login'); return; }
        fetchTickets();
        fetchAllAgents();
    }, [user, navigate]);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/api/tickets/assigned');
            setTickets(res.data);
        } catch { setError('Failed to fetch tickets'); }
    };

    const fetchAllAgents = async () => {
        try {
            const res = await api.get('/api/auth/agents');
            setAllAgents(res.data);
        } catch { /* silent */ }
    };

    const handleUpdateStatus = async (ticketId) => {
        if (!newStatus) { setError('Please select a status'); return; }
        setError(''); setSuccess('');
        try {
            await api.put(`/api/tickets/${ticketId}/status`, { status: newStatus });
            setSuccess('✅ Status updated!');
            setNewStatus('');
            fetchTickets();
        } catch (err) { setError(err.response?.data?.message || 'Failed to update status'); }
    };

    const handleReassign = async (ticketId) => {
        if (!newAgentId) { setError('Please select an agent'); return; }
        setError(''); setSuccess('');
        try {
            const res = await api.put(`/api/tickets/${ticketId}/reassign`, { newAgentId });
            setSuccess(res.data.message || '✅ Ticket reassigned!');
            setNewAgentId('');
            fetchTickets();
        } catch (err) { setError(err.response?.data?.message || 'Failed to reassign'); }
    };

    const handleAddComment = async (ticketId) => {
        if (!commentText.trim()) { setError('Comment cannot be empty'); return; }
        setError('');
        try {
            const res = await api.post(`/api/tickets/${ticketId}/comments`, {
                text: commentText, isInternal
            });
            // update ticket in local state immediately
            setTickets(prev => prev.map(t => t._id === ticketId ? res.data : t));
            setCommentText('');
            setIsInternal(false);
            setSuccess('💬 Comment posted!');
        } catch (err) { setError(err.response?.data?.message || 'Failed to post comment'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const stats = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    }), [tickets]);

    const urgentCount = useMemo(() =>
        tickets.filter(t => t.priority === 'URGENT' && t.status === 'OPEN').length
        , [tickets]);

    const filteredTickets = useMemo(() => tickets
        .filter(t => {
            const q = searchTerm.toLowerCase();
            const matchesSearch = t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                (t.ticketId || '').toLowerCase().includes(q) ||
                t.customerId?.name?.toLowerCase().includes(q);
            return matchesSearch &&
                (statusFilter === 'ALL' || t.status === statusFilter) &&
                (priorityFilter === 'ALL' || t.priority === priorityFilter) &&
                (categoryFilter === 'ALL' || t.category === categoryFilter);
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'status') return a.status.localeCompare(b.status);
            if (sortBy === 'priority') {
                const order = { URGENT: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
                return order[b.priority || 'MEDIUM'] - order[a.priority || 'MEDIUM'];
            }
            return 0;
        }), [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy]);

    return (
        <div>
            {/* Lightbox */}
            {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

            <nav className="navbar">
                <h1>Support Ticket System</h1>
                <div className="navbar-user">
                    {urgentCount > 0 && (
                        <span className="urgent-badge" title={`${urgentCount} urgent open ticket(s)`}>
                            🔴 {urgentCount} Urgent
                        </span>
                    )}
                    <ThemeToggle />
                    <span>Welcome, {user?.name} <em style={{ color: 'var(--primary-light)', fontStyle: 'normal' }}>(Agent)</em></span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="container">
                <div className="dashboard">
                    <h2>Agent Dashboard</h2>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card"><h3>Total Assigned</h3><p>{stats.total}</p></div>
                        <div className="stat-card status-open-card"><h3>Open</h3><p>{stats.open}</p></div>
                        <div className="stat-card status-progress-card"><h3>In Progress</h3><p>{stats.inProgress}</p></div>
                        <div className="stat-card status-resolved-card"><h3>Resolved</h3><p>{stats.resolved}</p></div>
                    </div>

                    {/* Controls */}
                    <div className="controls-bar glass">
                        <div className="control-group">
                            <input type="text" placeholder="🔍 Search by title, ref ID, customer..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="search-input" />
                        </div>
                        <div className="control-group">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="ALL">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                        <div className="control-group">
                            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                <option value="ALL">All Priorities</option>
                                <option value="URGENT">🔴 Urgent</option>
                                <option value="HIGH">🟡 High</option>
                                <option value="MEDIUM">🔵 Medium</option>
                                <option value="LOW">🟢 Low</option>
                            </select>
                        </div>
                        <div className="control-group">
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                <option value="ALL">All Categories</option>
                                <option value="TECHNICAL">⚙️ Technical</option>
                                <option value="BILLING">💳 Billing</option>
                                <option value="FEATURE_REQUEST">💡 Feature Request</option>
                                <option value="GENERAL">General</option>
                            </select>
                        </div>
                        <div className="control-group">
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="priority">Highest Priority</option>
                                <option value="status">By Status</option>
                            </select>
                        </div>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Ticket List <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>({filteredTickets.length})</span></h3>
                    </div>

                    <div className="tickets-list">
                        {filteredTickets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <h4>No tickets found</h4>
                                <p>Try adjusting your filters or search term.</p>
                            </div>
                        ) : filteredTickets.map((ticket) => {
                            const age = getAge(ticket.createdAt);
                            const isExpanded = expandedTicket === ticket._id;
                            const visibleComments = ticket.comments || [];

                            return (
                                <div key={ticket._id} className={`ticket-card ${isExpanded ? 'ticket-card--expanded' : ''}`}>
                                    {/* ── Header ── */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                                <span className="ticket-ref-id">{ticket.ticketId || 'TKT-LEGACY'}</span>
                                                <span className="badge-category">{ticket.category || 'GENERAL'}</span>
                                                {ticket.comments?.length > 0 && (
                                                    <span className="comment-count-badge">💬 {ticket.comments.length}</span>
                                                )}
                                            </div>
                                            <h3 style={{ marginBottom: 0 }}>{ticket.title}</h3>
                                        </div>
                                        <span className={`badge-priority priority-${(ticket.priority || 'medium').toLowerCase()}`}>
                                            {ticket.priority || 'MEDIUM'}
                                        </span>
                                    </div>

                                    {/* ── Meta row ── */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', margin: '0.75rem 0', fontSize: '0.85rem' }}>
                                        <span>
                                            <strong>Customer:</strong> {ticket.customerId?.name}
                                            <span style={{ color: 'var(--text-light)' }}> ({ticket.customerId?.email})</span>
                                        </span>
                                        <span>
                                            <strong>Status:</strong>
                                            <span className={`ticket-status status-${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                                        </span>
                                        <span className="sla-age" style={{ color: age.color, marginLeft: 'auto' }}>
                                            🕒 {age.label}
                                        </span>
                                    </div>

                                    {!isExpanded && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {ticket.description}
                                        </p>
                                    )}

                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                                        Reassigned: {ticket.reassignmentCount}/1
                                        {ticket.reassignmentCount >= 1 && <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>⚠️ Limit reached</span>}
                                    </div>

                                    {/* ── Expand toggle ── */}
                                    <button
                                        className="expand-toggle"
                                        onClick={() => {
                                            setExpandedTicket(isExpanded ? null : ticket._id);
                                            setNewStatus(''); setNewAgentId(''); setCommentText('');
                                            if (error) setError(''); if (success) setSuccess('');
                                        }}
                                    >
                                        {isExpanded ? '▲ Collapse' : '▼ View Details & Manage'}
                                    </button>

                                    {/* ── Expanded Panel ── */}
                                    {isExpanded && (
                                        <div className="ticket-expanded-panel">
                                            {/* Description */}
                                            <div className="panel-section">
                                                <h4>📝 Description</h4>
                                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{ticket.description}</p>
                                            </div>

                                            {/* Attachments with lightbox */}
                                            {ticket.attachments?.length > 0 && (
                                                <div className="panel-section">
                                                    <h4>📎 Attachments ({ticket.attachments.length})</h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                                                        {ticket.attachments.map((att, i) => {
                                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename);
                                                            return isImage ? (
                                                                <img
                                                                    key={i}
                                                                    src={`${BACKEND_URL}${att.url}`}
                                                                    alt={att.filename}
                                                                    className="attachment-thumb"
                                                                    onClick={() => setLightbox({ src: `${BACKEND_URL}${att.url}`, alt: att.filename })}
                                                                    title="Click to enlarge"
                                                                />
                                                            ) : (
                                                                <a key={i} href={`${BACKEND_URL}${att.url}`} target="_blank" rel="noreferrer" className="attachment-pill">
                                                                    📎 {att.filename}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Comment Thread */}
                                            <div className="panel-section">
                                                <h4>💬 Conversation Thread</h4>
                                                <div className="comment-thread">
                                                    {visibleComments.length === 0 ? (
                                                        <p className="no-comments">No replies yet. Start the conversation below.</p>
                                                    ) : visibleComments.map((c, i) => (
                                                        <div key={i} className={`comment-bubble ${c.authorRole === 'AGENT' ? 'comment-agent' : 'comment-customer'} ${c.isInternal ? 'comment-internal' : ''}`}>
                                                            <div className="comment-meta">
                                                                <span className="comment-author">{c.authorName}</span>
                                                                <span className={`comment-role-badge role-${c.authorRole.toLowerCase()}`}>{c.authorRole}</span>
                                                                {c.isInternal && <span className="internal-tag">🔒 Internal Note</span>}
                                                                <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            <p className="comment-text">{c.text}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add comment */}
                                                <div className="comment-compose">
                                                    <textarea
                                                        value={commentText}
                                                        onChange={e => setCommentText(e.target.value)}
                                                        placeholder="Type your reply or internal note..."
                                                        rows={3}
                                                        className="comment-input"
                                                    />
                                                    <div className="comment-compose-actions">
                                                        <label className="internal-toggle">
                                                            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                                                            🔒 Internal note only
                                                        </label>
                                                        <button onClick={() => handleAddComment(ticket._id)} className="btn btn-primary btn-small">
                                                            Send Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Manage Actions */}
                                            <div className="panel-section">
                                                <h4>⚙️ Manage Ticket</h4>
                                                <div className="ticket-actions">
                                                    <div className="form-group">
                                                        <label>Update Status</label>
                                                        <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                                            <option value="">Select Status</option>
                                                            <option value="OPEN">Open</option>
                                                            <option value="IN_PROGRESS">In Progress</option>
                                                            <option value="RESOLVED">Resolved</option>
                                                            <option value="CLOSED">Closed</option>
                                                        </select>
                                                        <button onClick={() => handleUpdateStatus(ticket._id)} className="btn btn-primary btn-small">
                                                            Update
                                                        </button>
                                                    </div>

                                                    {ticket.reassignmentCount < 1 && allAgents.length > 0 && (
                                                        <div className="form-group">
                                                            <label>Reassign to Agent</label>
                                                            <select value={newAgentId} onChange={e => setNewAgentId(e.target.value)}>
                                                                <option value="">Select Agent</option>
                                                                {allAgents.filter(a => a._id !== user._id).map(a => (
                                                                    <option key={a._id} value={a._id}>{a.name} ({a.email})</option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => handleReassign(ticket._id)} className="btn btn-primary btn-small">
                                                                Reassign
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;
