import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Reporting = () => {
    const [stats, setStats] = useState({ total: 0, resolved: 0, open: 0, urgent: 0 });
    const [loading, setLoading] = useState(true);

    const [breakdown, setBreakdown] = useState({ priorities: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, categories: {} });

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/api/tickets/assigned'); // Simplest way to get data for now
                const tickets = res.data;
                setStats({
                    total: tickets.length,
                    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
                    open: tickets.filter(t => t.status === 'OPEN').length,
                    urgent: tickets.filter(t => t.priority === 'URGENT').length
                });

                const bd = { priorities: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, categories: {} };
                tickets.forEach(t => {
                    const pri = t.priority || 'MEDIUM';
                    const cat = t.category || 'GENERAL';
                    bd.priorities[pri] = (bd.priorities[pri] || 0) + 1;
                    bd.categories[cat]   = (bd.categories[cat] || 0) + 1;
                });
                setBreakdown(bd);

            } catch (err) {
                console.error("Failed to load metrics");
            }
            setLoading(false);
        };
        fetchMetrics();
    }, []);

    return (
        <div className="container dashboard" style={{ width: '100%', maxWidth: '100%', padding: '2rem 4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Reporting</h2>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Understand your business metrics and improve the entire customer experience.
            </p>

            {loading ? (
                <div>Loading analytics...</div>
            ) : (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div className="stat-card glass">
                        <h3>Total Volume</h3>
                        <p>{stats.total}</p>
                    </div>
                    <div className="stat-card glass status-resolved-card">
                        <h3>Tickets Solved</h3>
                        <p>{stats.resolved}</p>
                    </div>
                    <div className="stat-card glass status-open-card">
                        <h3>Backlog (Open)</h3>
                        <p>{stats.open}</p>
                    </div>
                    <div className="stat-card glass">
                        <h3>Urgent Escalations</h3>
                        <p style={{background: 'linear-gradient(135deg, #f87171, #b91c1c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                            {stats.urgent}
                        </p>
                    </div>
                </div>
            )}

            <div className="glass" style={{ marginTop: '2rem', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>📈</span> Ticket Priorities Distribution
                </h3>
                
                {loading ? <p>Loading data...</p> : (
                    <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', background: 'var(--border-color)', marginBottom: '1rem' }}>
                        {stats.total === 0 ? (
                            <div style={{ flex: 1, background: 'var(--bg-card-hover)' }} />
                        ) : (
                            <>
                                <div title={`Urgent: ${breakdown.priorities.URGENT}`} style={{ width: `${(breakdown.priorities.URGENT / stats.total) * 100}%`, background: '#ef4444', transition: 'width 1s ease' }} />
                                <div title={`High: ${breakdown.priorities.HIGH}`} style={{ width: `${(breakdown.priorities.HIGH / stats.total) * 100}%`, background: '#f59e0b', transition: 'width 1s ease' }} />
                                <div title={`Medium: ${breakdown.priorities.MEDIUM}`} style={{ width: `${(breakdown.priorities.MEDIUM / stats.total) * 100}%`, background: '#3b82f6', transition: 'width 1s ease' }} />
                                <div title={`Low: ${breakdown.priorities.LOW}`} style={{ width: `${(breakdown.priorities.LOW / stats.total) * 100}%`, background: '#10b981', transition: 'width 1s ease' }} />
                            </>
                        )}
                    </div>
                )}
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#ef4444'}}></div> Urgent ({breakdown.priorities.URGENT})</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f59e0b'}}></div> High ({breakdown.priorities.HIGH})</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#3b82f6'}}></div> Medium ({breakdown.priorities.MEDIUM})</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#10b981'}}></div> Low ({breakdown.priorities.LOW})</span>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
