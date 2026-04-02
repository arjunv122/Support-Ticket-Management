import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ProfileDropdown from '../components/ProfileDropdown';
import ProfileModal from '../components/ProfileModal';
import ImageLightbox from '../components/ImageLightbox';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CustomerDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' });
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [lightbox, setLightbox] = useState(null);
    const [profileModalTab, setProfileModalTab] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'CUSTOMER') { navigate('/login'); return; }
        fetchTickets();
    }, [user, navigate]);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/api/tickets/my-tickets');
            setTickets(res.data);
        } catch { setError('Failed to fetch tickets'); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length > 5) { setError('Maximum 5 attachments allowed.'); return; }
        setFiles(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('priority', formData.priority);
            data.append('category', formData.category);
            files.forEach(f => data.append('attachments', f));
            await api.post('/api/tickets', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess('🎉 Ticket submitted! Our support team will respond shortly.');
            setFormData({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' });
            setFiles([]);
            e.target.reset();
            fetchTickets();
        } catch (err) { setError(err.response?.data?.message || 'Failed to create ticket'); }
        setLoading(false);
    };

    const handleAddComment = async (ticketId) => {
        if (!commentText.trim()) { setError('Comment cannot be empty'); return; }
        setError('');
        try {
            const res = await api.post(`/api/tickets/${ticketId}/comments`, { text: commentText });
            setTickets(prev => prev.map(t => t._id === ticketId ? res.data : t));
            setCommentText('');
            setSuccess('💬 Reply sent!');
        } catch (err) { setError(err.response?.data?.message || 'Failed to post reply'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const HISTORY_STATUSES = ['RESOLVED', 'CLOSED'];
    const ACTIVE_STATUSES  = ['OPEN', 'IN_PROGRESS'];

    const displayTickets = tickets.filter(t =>
        activeTab === 'history' ? HISTORY_STATUSES.includes(t.status) : ACTIVE_STATUSES.includes(t.status)
    );
    const activeCount  = tickets.filter(t => ACTIVE_STATUSES.includes(t.status)).length;
    const historyCount = tickets.filter(t => HISTORY_STATUSES.includes(t.status)).length;

    return (
        <div>
            {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
            {profileModalTab && <ProfileModal user={user} onClose={() => setProfileModalTab(null)} initialTab={profileModalTab} />}

            {/* ── Navbar ── */}
            <nav className="navbar">
                <h1 className="navbar-brand">TicketFlow</h1>
                <div className="navbar-user">
                    <ProfileDropdown
                        user={user}
                        onLogout={handleLogout}
                        onOpenProfile={(tab) => setProfileModalTab(tab)}
                    />
                </div>
            </nav>

            <div className="container">
                <div className="dashboard">
                    <h2>My Support Portal</h2>

                    {/* Create Ticket Form */}
                    <div className="ticket-form">
                        <h3>🎫 Raise a New Support Ticket</h3>
                        {error   && <div className="error-message">⚠️ {error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Issue Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange}
                                    required placeholder="e.g. Payment not processed, Login error..." />
                            </div>

                            <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                                <div className="form-group" style={{ flex:1, minWidth:160 }}>
                                    <label>Priority</label>
                                    <select name="priority" value={formData.priority} onChange={handleChange}>
                                        <option value="LOW">🟢 Low</option>
                                        <option value="MEDIUM">🔵 Medium</option>
                                        <option value="HIGH">🟡 High</option>
                                        <option value="URGENT">🔴 Urgent</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex:1, minWidth:160 }}>
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleChange}>
                                        <option value="GENERAL">General</option>
                                        <option value="TECHNICAL">⚙️ Technical</option>
                                        <option value="BILLING">💳 Billing</option>
                                        <option value="FEATURE_REQUEST">💡 Feature Request</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange}
                                    rows="4" required placeholder="Describe your issue in detail..." />
                            </div>

                            <div className="form-group">
                                <label>Attachments</label>
                                <div className="file-upload-area">
                                    <input type="file" id="file-input" multiple accept="image/*,.pdf,.txt,.doc,.docx"
                                        onChange={handleFileChange} style={{ display:'none' }} />
                                    <label htmlFor="file-input" className="file-upload-label">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                        </svg>
                                        <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload or drag & drop'}</span>
                                        <small>Max 5 files · 5MB each · Images, PDF, DOC</small>
                                    </label>
                                    {files.length > 0 && (
                                        <div className="file-preview-list">
                                            {files.map((f, i) => (
                                                <div key={i} className="file-preview-item">
                                                    <span>📎 {f.name}</span>
                                                    <span className="file-size">({(f.size/1024).toFixed(1)} KB)</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%' }}>
                                {loading ? '⏳ Submitting...' : '🚀 Submit Ticket'}
                            </button>
                        </form>
                    </div>

                    {/* Tab switcher */}
                    <div className="tab-switcher">
                        <button className={`tab-switch-btn ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('active'); setExpandedTicket(null); }}>
                            My Active Tickets
                            <span className="tab-count">{activeCount}</span>
                        </button>
                        <button className={`tab-switch-btn ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('history'); setExpandedTicket(null); }}>
                            History
                            <span className="tab-count">{historyCount}</span>
                        </button>
                    </div>

                    {/* Ticket list */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                        <h3 style={{ margin: 0 }}>
                            {activeTab === 'history' ? 'Ticket History' : 'Active Tickets'}
                            <span style={{ fontSize:'0.875rem', color:'var(--text-muted)', fontWeight:500, marginLeft:'0.5rem' }}>
                                ({displayTickets.length})
                            </span>
                        </h3>
                    </div>

                    <div className="tickets-list">
                        {displayTickets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">{activeTab === 'history' ? '📁' : '🎫'}</div>
                                <h4>{activeTab === 'history' ? 'No history yet' : 'No active tickets'}</h4>
                                <p>{activeTab === 'history' ? 'Your resolved and closed tickets will appear here.' : 'Raise a ticket above and we\'ll get back to you shortly.'}</p>
                            </div>
                        ) : displayTickets.map((ticket) => {
                            const isExpanded = expandedTicket === ticket._id;
                            const visibleComments = (ticket.comments || []).filter(c => !c.isInternal);

                            return (
                                <div key={ticket._id} className={`ticket-card ${isExpanded ? 'ticket-card--expanded' : ''}`}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', marginBottom:'0.75rem' }}>
                                        <div>
                                            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.35rem' }}>
                                                <span className="ticket-ref-id">{ticket.ticketId || 'TKT-LEGACY'}</span>
                                                <span className="badge-category">{ticket.category}</span>
                                                {visibleComments.length > 0 && <span className="comment-count-badge">💬 {visibleComments.length}</span>}
                                            </div>
                                            <h3 style={{ marginBottom:0 }}>{ticket.title}</h3>
                                        </div>
                                        <span className={`badge-priority priority-${(ticket.priority||'MEDIUM').toLowerCase()}`}>{ticket.priority}</span>
                                    </div>

                                    <div style={{ display:'flex', flexWrap:'wrap', gap:'1rem', alignItems:'center', marginBottom:'0.5rem', fontSize:'0.85rem' }}>
                                        <span><strong>Status:</strong>
                                            <span className={`ticket-status status-${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                                        </span>
                                        {ticket.assignedAgentId && <span>👤 Agent: <strong>{ticket.assignedAgentId.name}</strong></span>}
                                        <span style={{ color:'var(--text-light)', marginLeft:'auto', fontSize:'0.8rem' }}>
                                            🕒 {new Date(ticket.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    {!isExpanded && (
                                        <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'0.5rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                                            {ticket.description}
                                        </p>
                                    )}

                                    <button className="expand-toggle"
                                        onClick={() => { setExpandedTicket(isExpanded ? null : ticket._id); setCommentText(''); }}>
                                        {isExpanded ? '▲ Collapse' : '▼ View Details & Reply'}
                                    </button>

                                    {isExpanded && (
                                        <div className="ticket-expanded-panel">
                                            <div className="panel-section">
                                                <h4>📝 Description</h4>
                                                <p style={{ color:'var(--text-muted)', lineHeight:1.7 }}>{ticket.description}</p>
                                            </div>

                                            {ticket.attachments?.length > 0 && (
                                                <div className="panel-section">
                                                    <h4>📎 Attachments</h4>
                                                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', marginTop:'0.5rem' }}>
                                                        {ticket.attachments.map((att, i) => {
                                                            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename);
                                                            return isImg ? (
                                                                <img key={i} src={`${BACKEND_URL}${att.url}`} alt={att.filename}
                                                                    className="attachment-thumb"
                                                                    onClick={() => setLightbox({ src:`${BACKEND_URL}${att.url}`, alt:att.filename })} />
                                                            ) : (
                                                                <a key={i} href={`${BACKEND_URL}${att.url}`} target="_blank" rel="noreferrer" className="attachment-pill">📎 {att.filename}</a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="panel-section">
                                                <h4>💬 Conversation</h4>
                                                <div className="comment-thread">
                                                    {visibleComments.length === 0 ? (
                                                        <p className="no-comments">No replies yet.</p>
                                                    ) : visibleComments.map((c, i) => (
                                                        <div key={i} className={`comment-bubble ${c.authorRole==='AGENT'?'comment-agent':'comment-customer'}`}>
                                                            <div className="comment-meta">
                                                                <span className="comment-author">{c.authorName}</span>
                                                                <span className={`comment-role-badge role-${c.authorRole.toLowerCase()}`}>{c.authorRole}</span>
                                                                <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            <p className="comment-text">{c.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {activeTab === 'active' && (
                                                    <div className="comment-compose">
                                                        <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                                                            placeholder="Add more details or reply to your agent..." rows={3} className="comment-input" />
                                                        <div className="comment-compose-actions">
                                                            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Replies go directly to your agent</span>
                                                            <button onClick={() => handleAddComment(ticket._id)} className="btn btn-primary btn-small">Send Reply</button>
                                                        </div>
                                                    </div>
                                                )}
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

export default CustomerDashboard;
