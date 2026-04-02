import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Directory.css';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/api/auth/customers'); // Assuming this route exists
                setCustomers(res.data);
            } catch (err) { console.error('Failed to fetch customers'); }
            setLoading(false);
        };
        fetchCustomers();
    }, []);

    return (
        <div className="container dashboard" style={{ width: '100%', maxWidth: '100%', padding: '2rem 4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Customers</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Add, search, and manage your customers (end users) in one place.</p>
            
            <div className="glass" style={{ padding: '0', overflow: 'hidden', width: '100%' }}>
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem'}}>Loading...</td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem'}}>No customers found.</td></tr>
                        ) : customers.map(c => (
                            <tr key={c._id}>
                                <td>
                                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                        <div className="profile-avatar-initials" style={{width:'24px', height:'24px', fontSize:'0.6rem'}}>
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        {c.name}
                                    </div>
                                </td>
                                <td>{c.email}</td>
                                <td><span className="badge-category">{c.role}</span></td>
                                <td style={{color:'var(--text-light)'}}>{new Date(c.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Customers;
