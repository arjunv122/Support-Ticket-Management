import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ImageLightbox from '../components/ImageLightbox';
import KanbanBoard from '../components/KanbanBoard'; // PHASE 6: UI/UX
import './AgentDashboard.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Advanced SLA Matrix (Max Hours before turning Yellow / Red)
const SLAMatrix = {
    URGENT: { warning: 1,  breach: 2   }, // Red after 2h
    HIGH:   { warning: 8,  breach: 24  }, // Red after 24h
    MEDIUM: { warning: 48, breach: 72  }, // Red after 72h
    LOW:    { warning: 72, breach: 120 }  // Red after 5 days
};

const getAge = (date, priority = 'MEDIUM') => {
    const diff  = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);

    const policy = SLAMatrix[priority] || SLAMatrix.MEDIUM;
    let color = '#10b981'; // Green
    
    if (hours >= policy.breach) color = '#ef4444'; // Red
    else if (hours >= policy.warning) color = '#f59e0b'; // Yellow

    if (mins < 60)  return { label: `${mins}m ago`,  color };
    if (hours < 24) return { label: `${hours}h ago`, color };
    return { label: `${days}d ago`, color };
};

const AgentDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [allAgents, setAllAgents] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [activeTicketEvents, setActiveTicketEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [newAgentId, setNewAgentId] = useState('');
    const [commentText, setCommentText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [lightbox, setLightbox] = useState(null);

    // Filter state
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');

    // Phase 6 Kanban toggle
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'board'

    const { user } = useAuth();
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

    const handleUpdateStatus = async (ticketId, forceStatus = null) => {
        const payloadStatus = forceStatus || newStatus;
        if (!payloadStatus) { setError('Please select a status'); return; }
        setError(''); setSuccess('');
        try {
            await api.put(`/api/tickets/${ticketId}/status`, { status: payloadStatus });
            setSuccess('✅ Status updated!');
            if (!forceStatus) setNewStatus('');
            fetchTickets();
            // Refetch events if still expanded
            if (expandedTicket === ticketId) fetchEvents(ticketId);
        } catch (err) { setError(err.response?.data?.message || 'Failed to update status'); }
    };

    const fetchEvents = async (ticketId) => {
        setEventsLoading(true);
        try {
            const res = await api.get(`/api/tickets/${ticketId}/events`);
            setActiveTicketEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch events', err);
        } finally {
            setEventsLoading(false);
        }
    };

    useEffect(() => {
        if (expandedTicket) fetchEvents(expandedTicket);
        else setActiveTicketEvents([]);
    }, [expandedTicket]);

    const handleReassign = async (ticketId, forceAgentId = null) => {
        const payloadAgentId = forceAgentId || newAgentId;
        if (!payloadAgentId) { setError('Please select an agent'); return; }
        setError(''); setSuccess('');
        try {
            const res = await api.put(`/api/tickets/${ticketId}/reassign`, { newAgentId: payloadAgentId });
            setSuccess(res.data.message || '✅ Ticket reassigned!');
            if (!forceAgentId) setNewAgentId('');
            fetchTickets();
            if (expandedTicket === ticketId) fetchEvents(ticketId);
        } catch (err) { setError(err.response?.data?.message || 'Failed to reassign'); }
    };

    const handleTogglePin = async (ticketId, e) => {
        if(e) e.stopPropagation();
        try {
            const res = await api.put(`/api/tickets/${ticketId}/pin`);
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, pinnedBy: res.data.ticket.pinnedBy } : t));
        } catch (error) { console.error('Error toggling pin', error); }
    };

    useEffect(() => {
        if (error || success) {
            const t = setTimeout(() => { setError(''); setSuccess(''); }, 4000);
            return () => clearTimeout(t);
        }
    }, [error, success]);

    const handleAddTag = async (ticketId, ticket, newTag) => {
        if (!newTag.trim() || ticket.tags?.includes(newTag.trim())) return;
        try {
            const updatedTags = [...(ticket.tags || []), newTag.trim()];
            const res = await api.put(`/api/tickets/${ticketId}/tags`, { tags: updatedTags });
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, tags: res.data.tags } : t));
        } catch (error) { console.error('Error adding tag', error); }
    };

    const handleRemoveTag = async (ticketId, ticket, tagToRemove) => {
        try {
            const updatedTags = ticket.tags.filter(tag => tag !== tagToRemove);
            const res = await api.put(`/api/tickets/${ticketId}/tags`, { tags: updatedTags });
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, tags: res.data.tags } : t));
        } catch (error) { console.error('Error removing tag', error); }
    };

    const handleAddComment = async (ticketId) => {
        if (!commentText.trim()) { setError('Comment cannot be empty'); return; }
        setError('');
        try {
            const res = await api.post(`/api/tickets/${ticketId}/comments`, { text: commentText, isInternal });
            setTickets(prev => prev.map(t => t._id === ticketId ? res.data : t));
            setCommentText(''); setIsInternal(false);
            setSuccess('💬 Comment posted!');
            if (expandedTicket === ticketId) fetchEvents(ticketId);
        } catch (err) { setError(err.response?.data?.message || 'Failed to post comment'); }
    };

    // Split into active vs history
    const HISTORY_STATUSES = ['RESOLVED', 'CLOSED'];
    const ACTIVE_STATUSES  = ['OPEN', 'IN_PROGRESS'];

    const stats = useMemo(() => ({
        total:      tickets.length,
        open:       tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved:   tickets.filter(t => t.status === 'RESOLVED').length,
    }), [tickets]);

    const urgentCount = useMemo(() =>
        tickets.filter(t => t.priority === 'URGENT' && t.status === 'OPEN').length
    , [tickets]);

    const baseFiltered = useMemo(() => {
        const tab = activeTab === 'history' ? HISTORY_STATUSES : ACTIVE_STATUSES;
        return tickets
            .filter(t => {
                const q = searchTerm.toLowerCase();
                const matchSearch = t.title.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    (t.ticketId || '').toLowerCase().includes(q) ||
                    t.customerId?.name?.toLowerCase().includes(q);
                return tab.includes(t.status) && matchSearch &&
                    (statusFilter === 'ALL'   || t.status   === statusFilter) &&
                    (priorityFilter === 'ALL' || t.priority === priorityFilter) &&
                    (categoryFilter === 'ALL' || t.category === categoryFilter);
            })
            .sort((a, b) => {
                if (sortBy === 'newest')   return new Date(b.createdAt) - new Date(a.createdAt);
                if (sortBy === 'oldest')   return new Date(a.createdAt) - new Date(b.createdAt);
                if (sortBy === 'priority') {
                    const order = { URGENT:3, HIGH:2, MEDIUM:1, LOW:0 };
                    return order[b.priority||'MEDIUM'] - order[a.priority||'MEDIUM'];
                }
                return 0;
            })
            // Pin strictly at top
            .sort((a,b) => {
                const aPinned = a.pinnedBy?.includes(user._id) ? 1 : 0;
                const bPinned = b.pinnedBy?.includes(user._id) ? 1 : 0;
                return bPinned - aPinned;
            });
    }, [tickets, activeTab, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, user?._id]);

    const activeCount  = tickets.filter(t => ACTIVE_STATUSES.includes(t.status)).length;
    const historyCount = tickets.filter(t => HISTORY_STATUSES.includes(t.status)).length;

    return (
        <div>
            {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

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

                    {/* Tab switcher */}
                    <div className="tab-switcher">
                        <button className={`tab-switch-btn ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('active'); setExpandedTicket(null); }}>
                            Active Tickets
                            <span className="tab-count">{activeCount}</span>
                        </button>
                        <button className={`tab-switch-btn ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('history'); setExpandedTicket(null); }}>
                            History
                            <span className="tab-count">{historyCount}</span>
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="controls-bar glass">
                        <div className="control-group">
                            <input type="text" placeholder="🔍 Search by title, ref ID, customer..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
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
                            </select>
                        </div>
                    </div>

                    {error   && <div className="error-message">⚠️ {error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ margin: 0 }}>
                                {activeTab === 'history' ? 'Ticket History' : 'Active Tickets'}
                                <span style={{ fontSize:'0.875rem', color:'var(--text-muted)', fontWeight:500, marginLeft:'0.5rem' }}>
                                    ({baseFiltered.length})
                                </span>
                            </h3>

                            {activeTab === 'active' && (
                                <div className="kanban-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
                                    <button 
                                        className={`btn-toggle ${viewMode === 'table' ? 'active' : ''}`} 
                                        onClick={() => setViewMode('table')}
                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', border: 'none', background: viewMode === 'table' ? 'var(--primary)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                                        Table
                                    </button>
                                    <button 
                                        className={`btn-toggle ${viewMode === 'board' ? 'active' : ''}`} 
                                        onClick={() => setViewMode('board')}
                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', border: 'none', background: viewMode === 'board' ? 'var(--primary)' : 'transparent', color: viewMode === 'board' ? '#fff' : 'var(--text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                                        Board
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="view-transition-wrapper" key={viewMode + activeTab}>
                        {viewMode === 'board' && activeTab === 'active' ? (
                            <KanbanBoard 
                            tickets={baseFiltered} 
                            agents={allAgents} 
                            onStatusChange={handleUpdateStatus} 
                            onReassign={handleReassign} 
                            setError={setError} 
                            user={user}
                            onTogglePin={handleTogglePin}
                        />
                    ) : (
                    <div className="enterprise-table-wrapper">
                        {baseFiltered.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">{activeTab === 'history' ? '📁' : '🎉'}</div>
                                <h4>{activeTab === 'history' ? 'No history yet' : 'All clear!'}</h4>
                                <p>{activeTab === 'history' ? 'Resolved and closed tickets will appear here.' : 'No active tickets matching your filters.'}</p>
                            </div>
                        ) : (
                            <table className="enterprise-table">
                                <thead>
                                    <tr>
                                        <th>Ref ID</th>
                                        <th>Priority</th>
                                        <th>Subject</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>SLA Time</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {baseFiltered.map((ticket) => {
                                        const age = getAge(ticket.createdAt, ticket.priority);
                                        const ageColor = activeTab === 'history' ? 'var(--text-light)' : age.color;
                                        const isExpanded = expandedTicket === ticket._id;

                                        return (
                                            <React.Fragment key={ticket._id}>
                                                <tr className={`table-row ${isExpanded ? 'active-row' : ''}`} 
                                                    onClick={() => { setExpandedTicket(isExpanded ? null : ticket._id); setNewStatus(''); setNewAgentId(''); setCommentText(''); }}>
                                                    <td className="ticket-ref-id" style={{fontSize: '0.85rem'}}>
                                                        <button 
                                                            onClick={(e) => handleTogglePin(ticket._id, e)}
                                                            className="pin-btn"
                                                            style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'1.1rem', marginRight:'0.5rem', color: ticket.pinnedBy?.includes(user._id) ? '#fbbf24' : 'var(--text-muted)' }}>
                                                            {ticket.pinnedBy?.includes(user?._id) ? '★' : '☆'}
                                                        </button>
                                                        {ticket.ticketId || 'TKT-LEGACY'}
                                                    </td>
                                                    <td><span className={`badge-priority priority-${(ticket.priority||'medium').toLowerCase()}`}>{ticket.priority || 'MEDIUM'}</span></td>
                                                    <td className="table-title">
                                                        <span style={{ fontWeight: 600, color: 'var(--text-main)', display:'block' }}>{ticket.title}</span>
                                                        <div className="tags-preview" style={{ display:'flex', gap:'0.25rem', marginTop:'0.25rem' }}>
                                                            {(ticket.tags || []).map(tag => (
                                                                <span key={tag} style={{ background:'rgba(99,102,241,0.1)', color:'var(--primary-light)', padding:'0.1rem 0.4rem', borderRadius:'8px', fontSize:'0.65rem' }}>#{tag}</span>
                                                            ))}
                                                        </div>
                                                        {ticket.comments?.length > 0 && <span className="comment-count-badge" style={{marginTop:'0.25rem', transform:'scale(0.85)', display:'inline-block'}}>💬 {ticket.comments.length}</span>}
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)' }}>{ticket.customerId?.name}</td>
                                                    <td><span className={`ticket-status status-${ticket.status.toLowerCase()}`}>{ticket.status}</span></td>
                                                    <td style={{ color: ageColor, fontWeight: 700, fontSize: '0.85rem' }}>🕒 {age.label}</td>
                                                    <td>
                                                        <button className="btn btn-primary btn-small" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                                                            {isExpanded ? '▲ Close' : '▼ View'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="expanded-row-container">
                                                        <td colSpan="7" className="expanded-cell">
                                                            <div className="ticket-expanded-panel">
                                                                <div className="panel-section">
                                                                    <h4>📝 Description</h4>
                                                                    <p style={{ color:'var(--text-muted)', lineHeight:1.7 }}>{ticket.description}</p>
                                                                </div>

                                                                {/* TICKET TAGS */}
                                                                <div className="panel-section">
                                                                    <h4>🏷️ Tags</h4>
                                                                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.5rem' }}>
                                                                        {(ticket.tags || []).map(tag => (
                                                                            <span key={tag} className="tag-pill" style={{ background:'rgba(99,102,241,0.1)', color:'var(--primary-light)', padding:'0.2rem 0.6rem', borderRadius:'12px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                                                                                {tag}
                                                                                <button onClick={() => handleRemoveTag(ticket._id, ticket, tag)} style={{ background:'transparent', border:'none', color:'var(--primary-light)', cursor:'pointer', padding:0 }}>&times;</button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    <div style={{ display:'flex', gap:'0.5rem' }}>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Add a tag and press Enter..." 
                                                                            className="tag-input"
                                                                            onKeyDown={(e) => {
                                                                                if(e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    handleAddTag(ticket._id, ticket, e.target.value);
                                                                                    e.target.value = '';
                                                                                }
                                                                            }}
                                                                            style={{ padding:'0.4rem 0.8rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-color)', background:'var(--bg-input)', color:'var(--text-main)', fontSize:'0.8rem' }}
                                                                        />
                                                                    </div>
                                                                </div>



                                                                {ticket.attachments?.length > 0 && (
                                                                    <div className="panel-section">
                                                                        <h4>📎 Attachments ({ticket.attachments.length})</h4>
                                                                        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', marginTop:'0.5rem' }}>
                                                                            {ticket.attachments.map((att, i) => {
                                                                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename);
                                                                                return isImage ? (
                                                                                    <img key={i} src={`${BACKEND_URL}${att.url}`} alt={att.filename}
                                                                                        className="attachment-thumb"
                                                                                        onClick={(e) => { e.stopPropagation(); setLightbox({ src:`${BACKEND_URL}${att.url}`, alt:att.filename })}} />
                                                                                ) : (
                                                                                    <a key={i} href={`${BACKEND_URL}${att.url}`} target="_blank" rel="noreferrer" className="attachment-pill" onClick={e => e.stopPropagation()}>
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
                                                                        {(ticket.comments||[]).length === 0 ? (
                                                                            <p className="no-comments">No replies yet.</p>
                                                                        ) : (ticket.comments||[]).map((c, i) => (
                                                                            <div key={i} className={`comment-bubble ${c.authorRole==='AGENT' ? 'comment-agent':'comment-customer'} ${c.isInternal?'comment-internal':''}`}>
                                                                                <div className="comment-meta">
                                                                                    <span className="comment-author">{c.authorName}</span>
                                                                                    <span className={`comment-role-badge role-${c.authorRole.toLowerCase()}`}>{c.authorRole}</span>
                                                                                    {c.isInternal && <span className="internal-tag">🔒 Internal</span>}
                                                                                    <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                                                                                </div>
                                                                                <p className="comment-text">{c.text}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="comment-compose">
                                                                        <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                                                                            placeholder="Type a reply or internal note..." rows={3} className="comment-input" />
                                                                        <div className="comment-compose-actions">
                                                                            <label className="internal-toggle">
                                                                                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                                                                                🔒 Internal note only
                                                                            </label>
                                                                            <button onClick={() => handleAddComment(ticket._id)} className="btn btn-primary btn-small">Send Reply</button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Audit Timeline */}
                                                                <div className="panel-section">
                                                                    <h4>📜 Activity Timeline</h4>
                                                                    <div className="timeline-container">
                                                                        {eventsLoading ? (
                                                                            <p className="no-comments">Loading history...</p>
                                                                        ) : activeTicketEvents.length === 0 ? (
                                                                            <p className="no-comments">No activity recorded yet.</p>
                                                                        ) : (
                                                                            activeTicketEvents.map((evt, i) => (
                                                                                <div key={evt._id} className="timeline-event">
                                                                                    <div className="timeline-dot" />
                                                                                    <div className="timeline-content">
                                                                                        <div className="timeline-header">
                                                                                            <span className="timeline-user">{evt.user?.name || 'System'}</span>
                                                                                            <span className="timeline-time">{new Date(evt.createdAt).toLocaleString()}</span>
                                                                                        </div>
                                                                                        <div className="timeline-body">
                                                                                            {evt.action === 'CREATED' && <span>Created the ticket.</span>}
                                                                                            {evt.action === 'STATUS_CHANGED' && <span>Changed status from <span className="timeline-val">{evt.oldValue}</span> to <span className="timeline-val">{evt.newValue}</span>.</span>}
                                                                                            {evt.action === 'REASSIGNED' && <span>Reassigned ticket from agent <span className="timeline-val">{evt.oldValue}</span> to <span className="timeline-val">{evt.newValue}</span>.</span>}
                                                                                            {evt.action === 'COMMENT_ADDED' && <span>Added a {evt.newValue}.</span>}
                                                                                            {evt.action === 'PRIORITY_CHANGED' && <span>Changed priority to <span className="timeline-val">{evt.newValue}</span>.</span>}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Actions — only for active tickets */}
                                                                {activeTab === 'active' && (
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
                                                                                <button onClick={() => handleUpdateStatus(ticket._id)} className="btn btn-primary btn-small">Update</button>
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
                                                                                    <button onClick={() => handleReassign(ticket._id)} className="btn btn-primary btn-small">Reassign</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                </div>
                )}
                    </div>
            </div>
        </div>
    </div>
    );
};

export default AgentDashboard;
