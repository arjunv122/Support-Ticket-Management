import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Directory.css';

const Organizations = () => {
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', domain: '', tags: '' });
    const [error, setError] = useState('');

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/organizations');
            setOrgs(res.data);
            setError('');
        } catch (err) { setError('Failed to fetch orgs'); }
        setLoading(false);
    };

    useEffect(() => { fetchOrgs(); }, []);

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
            await api.post('/api/organizations', { ...formData, tags: tagsArray });
            setShowModal(false);
            setFormData({ name: '', domain: '', tags: '' });
            fetchOrgs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create organization');
        }
    };

    return (
        <div className="container dashboard" style={{ width: '100%', maxWidth: '100%', padding: '2rem 4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Organizations</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Organization</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Add, search, and manage your organizations all in one place.</p>
            {error && <div className="error-message" style={{marginBottom: '1rem'}}>⚠️ {error}</div>}
            
            <div className="glass" style={{ padding: '0', overflow: 'hidden', width: '100%' }}>
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Organization Name</th>
                            <th>Domain</th>
                            <th>Tags</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem'}}>Loading...</td></tr>
                        ) : orgs.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem'}}>No organizations found.</td></tr>
                        ) : orgs.map(org => (
                            <tr key={org._id}>
                                <td><strong style={{color:'var(--primary)'}}>{org.name}</strong></td>
                                <td>{org.domain || '-'}</td>
                                <td>
                                    {(org.tags || []).length === 0 ? '-' : (
                                        <div style={{display:'flex', gap:'4px'}}>
                                            {org.tags.map(t => <span key={t} className="badge-category">{t}</span>)}
                                        </div>
                                    )}
                                </td>
                                <td style={{color:'var(--text-light)'}}>{new Date(org.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Organization</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateOrg}>
                            <div className="form-group">
                                <label>Organization Name</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="form-group">
                                <label>Domain (Optional)</label>
                                <input type="text" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} placeholder="e.g. acme.com" />
                            </div>
                            <div className="form-group">
                                <label>Tags (Comma-separated)</label>
                                <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="e.g. VIP, Enterprise" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Create Organization</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Organizations;
