import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const features = [
    {
        icon: '🎫',
        title: 'Smart Ticket Management',
        desc: 'Auto-generate unique ticket IDs. Track every issue from creation to resolution with full audit trails.'
    },
    {
        icon: '💬',
        title: 'Real-Time Conversation',
        desc: 'Customers and agents communicate directly within each ticket. No email chains, no lost context.'
    },
    {
        icon: '📎',
        title: 'File & Screenshot Uploads',
        desc: 'Attach images, PDFs, and documents to tickets. See issues visually and resolve them faster.'
    },
    {
        icon: '⏱️',
        title: 'SLA Age Tracking',
        desc: 'Color-coded urgency indicators keep your team aware of response times. Never miss a deadline.'
    },
    {
        icon: '🔒',
        title: 'Role-Based Access',
        desc: 'Customers see only their tickets. Agents get full management tools. Secure by design.'
    },
    {
        icon: '🔁',
        title: 'Controlled Reassignment',
        desc: 'Each ticket can be reassigned once — ensuring accountability and fast resolution.'
    }
];

const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '<2h', label: 'Avg. Response Time' },
    { value: '5MB', label: 'File Upload Limit' },
    { value: '∞', label: 'Tickets Supported' },
];

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState('customer');

    return (
        <div className="landing-root">
            {/* ── Navbar ── */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="landing-logo">
                        <span className="logo-icon">⚡</span>
                        <span className="logo-text">TicketFlow</span>
                        <span className="logo-badge">PRO</span>
                    </div>
                    <div className="landing-nav-actions">
                        <ThemeToggle />
                        <Link to="/login" className="landing-btn-ghost">Sign In</Link>
                        <Link to="/register" className="landing-btn-primary">Get Started →</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="landing-hero">
                <div className="hero-glow hero-glow-1" />
                <div className="hero-glow hero-glow-2" />

                <div className="landing-container">
                    <div className="hero-badge">
                        <span>🚀</span> The support platform your team actually wants to use
                    </div>

                    <h1 className="hero-title">
                        Resolve tickets<br />
                        <span className="hero-title-gradient">10× faster</span>
                    </h1>

                    <p className="hero-subtitle">
                        A full-stack, production-ready support ticket platform with intelligent<br />
                        routing, real-time threads, file attachments, and SLA monitoring.
                    </p>

                    <div className="hero-actions">
                        <Link to="/register" className="hero-btn-primary">
                            Start for free →
                        </Link>
                        <Link to="/login" className="hero-btn-outline">
                            Sign in to dashboard
                        </Link>
                    </div>

                    {/* Role tabs */}
                    <div className="hero-tabs">
                        <button
                            className={`hero-tab ${activeTab === 'customer' ? 'active' : ''}`}
                            onClick={() => setActiveTab('customer')}
                        >
                            👤 For Customers
                        </button>
                        <button
                            className={`hero-tab ${activeTab === 'agent' ? 'active' : ''}`}
                            onClick={() => setActiveTab('agent')}
                        >
                            🛠️ For Support Agents
                        </button>
                    </div>

                    <div className="hero-tab-content">
                        {activeTab === 'customer' ? (
                            <ul className="tab-list">
                                <li>✅ Raise tickets in seconds with file attachments</li>
                                <li>✅ Track status in real-time with unique reference IDs</li>
                                <li>✅ Reply directly inside your ticket — no email needed</li>
                                <li>✅ View all your open, resolved &amp; closed issues in one place</li>
                            </ul>
                        ) : (
                            <ul className="tab-list">
                                <li>✅ Manage all assigned tickets with smart filters &amp; sorting</li>
                                <li>✅ Post internal-only notes visible only to your team</li>
                                <li>✅ View customer attachments with full-screen lightbox</li>
                                <li>✅ Live SLA age badges — never miss an urgent ticket</li>
                            </ul>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="landing-stats">
                <div className="landing-container">
                    <div className="stats-row">
                        {stats.map((s, i) => (
                            <div key={i} className="stat-pill">
                                <span className="stat-value">{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="landing-features">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-eyebrow">Everything you need</span>
                        <h2 className="section-title">Built for real support teams</h2>
                        <p className="section-desc">Every feature designed to reduce resolution time and improve customer satisfaction.</p>
                    </div>

                    <div className="features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card">
                                <div className="feature-icon">{f.icon}</div>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="landing-cta">
                <div className="landing-container">
                    <div className="cta-card">
                        <div className="cta-glow" />
                        <h2>Ready to transform<br />your support workflow?</h2>
                        <p>Join your team on TicketFlow today. No credit card required.</p>
                        <div className="cta-actions">
                            <Link to="/register" className="hero-btn-primary">Create free account →</Link>
                            <Link to="/login" className="hero-btn-outline">Already have an account</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-inner">
                        <div className="landing-logo">
                            <span className="logo-icon">⚡</span>
                            <span className="logo-text">TicketFlow</span>
                        </div>
                        <p className="footer-copy">© 2026 TicketFlow. Built for teams that care about support.</p>
                        <div className="footer-links">
                            <Link to="/login">Sign In</Link>
                            <Link to="/register">Register</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
