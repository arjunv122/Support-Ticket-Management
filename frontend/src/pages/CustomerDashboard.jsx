import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CustomerDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'CUSTOMER') {
            navigate('/login');
            return;
        }
        fetchTickets();
    }, [user, navigate]);

    const fetchTickets = async () => {
        try {
            const response = await api.get('/api/tickets/my-tickets');
            setTickets(response.data);
        } catch (error) {
            setError('Failed to fetch tickets');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.post('/api/tickets', formData);
            setSuccess('Ticket created successfully!');
            setFormData({ title: '', description: '' });
            fetchTickets();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create ticket');
        }

        setLoading(false);
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
                    <span>Welcome, {user?.name} (Customer)</span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="container">
                <div className="dashboard">
                    <h2>Customer Dashboard</h2>

                    <div className="ticket-form">
                        <h3>Create New Ticket</h3>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Ticket'}
                            </button>
                        </form>
                    </div>

                    <h3>My Tickets</h3>
                    <div className="tickets-list">
                        {tickets.length === 0 ? (
                            <p>No tickets found. Create your first ticket above!</p>
                        ) : (
                            tickets.map((ticket) => (
                                <div key={ticket._id} className="ticket-card">
                                    <h3>{ticket.title}</h3>
                                    <p>{ticket.description}</p>
                                    <p><strong>Status:</strong>
                                        <span className={`ticket-status status-${ticket.status.toLowerCase()}`}>
                                            {ticket.status}
                                        </span>
                                    </p>
                                    {ticket.assignedAgentId && (
                                        <p><strong>Assigned to:</strong> {ticket.assignedAgentId.name}</p>
                                    )}
                                    <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
