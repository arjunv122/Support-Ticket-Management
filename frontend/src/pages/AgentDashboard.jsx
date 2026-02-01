import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AgentDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [allAgents, setAllAgents] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [newAgentId, setNewAgentId] = useState('');

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'AGENT') {
            navigate('/login');
            return;
        }
        fetchTickets();
        fetchAllAgents();
    }, [user, navigate]);

    const fetchTickets = async () => {
        try {
            const response = await api.get('/api/tickets/assigned');
            setTickets(response.data);
        } catch (error) {
            setError('Failed to fetch tickets');
        }
    };

    const fetchAllAgents = async () => {
        try {
            const response = await api.get('/api/auth/agents');
            setAllAgents(response.data);
        } catch (error) {
            console.error('Failed to fetch agents');
        }
    };

    const handleUpdateStatus = async (ticketId) => {
        if (!newStatus) {
            setError('Please select a status');
            return;
        }

        setError('');
        setSuccess('');

        try {
            await api.put(`/api/tickets/${ticketId}/status`, { status: newStatus });
            setSuccess('Status updated successfully!');
            setSelectedTicket(null);
            setNewStatus('');
            fetchTickets();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleReassign = async (ticketId) => {
        if (!newAgentId) {
            setError('Please select an agent');
            return;
        }

        setError('');
        setSuccess('');

        try {
            const response = await api.put(`/api/tickets/${ticketId}/reassign`, {
                newAgentId
            });
            setSuccess(response.data.message || 'Ticket reassigned successfully!');
            setSelectedTicket(null);
            setNewAgentId('');
            fetchTickets();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reassign ticket');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- Statistics Logic ---
    const stats = useMemo(() => {
        const total = tickets.length;
        const open = tickets.filter(t => t.status === 'OPEN').length;
        const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
        const resolved = tickets.filter(t => t.status === 'RESOLVED').length;
        const closed = tickets.filter(t => t.status === 'CLOSED').length;
        return { total, open, inProgress, resolved, closed };
    }, [tickets]);

    // --- Filter & Sort Logic ---
    const filteredTickets = useMemo(() => {
        return tickets
            .filter(ticket => {
                const matchesSearch =
                    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    ticket.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

                const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
                if (sortBy === 'status') return a.status.localeCompare(b.status);
                return 0;
            });
    }, [tickets, searchTerm, statusFilter, sortBy]);

    return (
        <div>
            <nav className="navbar">
                <h1>Support Ticket System</h1>
                <div className="navbar-user">
                    <span>Welcome, {user?.name} (Agent)</span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="container">
                <div className="dashboard">
                    <h2>Agent Dashboard</h2>

                    {/* Statistics Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Total Assigned</h3>
                            <p>{stats.total}</p>
                        </div>
                        <div className="stat-card status-open-card">
                            <h3>Open</h3>
                            <p>{stats.open}</p>
                        </div>
                        <div className="stat-card status-progress-card">
                            <h3>In Progress</h3>
                            <p>{stats.inProgress}</p>
                        </div>
                        <div className="stat-card status-resolved-card">
                            <h3>Resolved</h3>
                            <p>{stats.resolved}</p>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="controls-bar glass">
                        <div className="control-group">
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="control-group">
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="ALL">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                        <div className="control-group">
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="status">Sort by Status</option>
                            </select>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <h3>Ticket List ({filteredTickets.length})</h3>
                    <div className="tickets-list">
                        {filteredTickets.length === 0 ? (
                            <p>No tickets found matching your criteria.</p>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <div key={ticket._id} className="ticket-card">
                                    <h3>{ticket.title}</h3>
                                    <p>{ticket.description}</p>
                                    <p><strong>Customer:</strong> {ticket.customerId?.name} ({ticket.customerId?.email})</p>
                                    <p><strong>Status:</strong>
                                        <span className={`ticket-status status-${ticket.status.toLowerCase()}`}>
                                            {ticket.status}
                                        </span>
                                    </p>
                                    <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
                                    <p><strong>Reassignment Count:</strong> {ticket.reassignmentCount}/1</p>

                                    {ticket.reassignmentCount >= 1 && (
                                        <div className="warning-message">
                                            ⚠️ This ticket has already been reassigned once.
                                        </div>
                                    )}

                                    <div className="ticket-actions">
                                        {selectedTicket === ticket._id ? (
                                            <>
                                                <div className="form-group">
                                                    <label>Update Status:</label>
                                                    <select
                                                        value={newStatus}
                                                        onChange={(e) => setNewStatus(e.target.value)}
                                                    >
                                                        <option value="">Select Status</option>
                                                        <option value="OPEN">Open</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="RESOLVED">Resolved</option>
                                                        <option value="CLOSED">Closed</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleUpdateStatus(ticket._id)}
                                                        className="btn btn-primary btn-small"
                                                    >
                                                        Update
                                                    </button>
                                                </div>

                                                {ticket.reassignmentCount < 1 && allAgents.length > 0 && (
                                                    <div className="form-group">
                                                        <label>Reassign to Agent:</label>
                                                        <select
                                                            value={newAgentId}
                                                            onChange={(e) => setNewAgentId(e.target.value)}
                                                        >
                                                            <option value="">Select Agent</option>
                                                            {allAgents
                                                                .filter(agent => agent._id !== user._id)
                                                                .map(agent => (
                                                                    <option key={agent._id} value={agent._id}>
                                                                        {agent.name} ({agent.email})
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        <button
                                                            onClick={() => handleReassign(ticket._id)}
                                                            className="btn btn-primary btn-small"
                                                        >
                                                            Reassign
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(null);
                                                        setNewStatus('');
                                                        setNewAgentId('');
                                                    }}
                                                    className="btn btn-secondary btn-small"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedTicket(ticket._id)}
                                                className="btn btn-primary btn-small"
                                            >
                                                Manage Ticket
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;
