import React, { useState, useEffect } from 'react';
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

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <h3>Assigned Tickets</h3>
                    <div className="tickets-list">
                        {tickets.length === 0 ? (
                            <p>No tickets assigned to you.</p>
                        ) : (
                            tickets.map((ticket) => (
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
                                            ⚠️ This ticket has already been reassigned once and cannot be reassigned again.
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
