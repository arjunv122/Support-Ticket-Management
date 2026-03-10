import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const features = [
    { icon: '🎫', text: 'Unique ticket reference IDs' },
    { icon: '💬', text: 'Real-time comment threads' },
    { icon: '📎', text: 'Screenshot & file attachments' },
    { icon: '⏱️', text: 'SLA age tracking & urgency alerts' },
];

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        const result = await login(formData.email, formData.password);
        setLoading(false);
        if (result.success) {
            navigate(result.user.role === 'CUSTOMER' ? '/customer-dashboard' : '/agent-dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-split">
            {/* ── Left Panel (branding) ── */}
            <div className="auth-split-left">
                <div className="auth-left-inner">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">⚡</span>
                        <span className="logo-text">TicketFlow</span>
                        <span className="logo-badge">PRO</span>
                    </Link>

                    <div className="auth-left-hero">
                        <h2>Support that moves<br />at the speed of business.</h2>
                        <p>Join thousands of teams using TicketFlow to deliver exceptional customer support — faster, smarter, and more organized.</p>
                    </div>

                    <ul className="auth-feature-list">
                        {features.map((f, i) => (
                            <li key={i}>
                                <span className="auth-feature-icon">{f.icon}</span>
                                {f.text}
                            </li>
                        ))}
                    </ul>

                    <div className="auth-left-glow-1" />
                    <div className="auth-left-glow-2" />
                </div>
            </div>

            {/* ── Right Panel (form) ── */}
            <div className="auth-split-right">
                <div className="auth-right-top">
                    <ThemeToggle />
                </div>

                <div className="auth-form-wrapper">
                    <div className="auth-form-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to your TicketFlow account</p>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Email address</label>
                            <input type="email" name="email" value={formData.email}
                                onChange={handleChange} required
                                placeholder="you@company.com" autoComplete="email" />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password" value={formData.password}
                                    onChange={handleChange} required
                                    placeholder="••••••••" autoComplete="current-password" />
                                <button type="button" className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span className="auth-spinner" /> Signing in...
                                </span>
                            ) : 'Sign in →'}
                        </button>
                    </form>

                    <div className="auth-divider"><span>or</span></div>

                    <div className="auth-switch">
                        Don't have an account?{' '}
                        <Link to="/register">Create one free →</Link>
                    </div>

                    <Link to="/" className="auth-back-link">← Back to home</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
