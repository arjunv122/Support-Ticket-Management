import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        const result = await register(formData.name, formData.email, formData.password, formData.role);
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
                        <h2>Your first ticket,<br />30 seconds away.</h2>
                        <p>Create your account and start resolving customer issues with a platform built for speed, clarity, and collaboration.</p>
                    </div>

                    <div className="auth-role-cards">
                        <div
                            className={`auth-role-card ${formData.role === 'CUSTOMER' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                        >
                            <span className="role-card-icon">👤</span>
                            <div>
                                <strong>Customer</strong>
                                <p>Raise tickets &amp; track issues</p>
                            </div>
                        </div>
                        <div
                            className={`auth-role-card ${formData.role === 'AGENT' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, role: 'AGENT' })}
                        >
                            <span className="role-card-icon">🛠️</span>
                            <div>
                                <strong>Support Agent</strong>
                                <p>Manage &amp; resolve tickets</p>
                            </div>
                        </div>
                    </div>

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
                        <h2>Create your account</h2>
                        <p>Get started with TicketFlow — free forever</p>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Full name</label>
                            <input type="text" name="name" value={formData.name}
                                onChange={handleChange} required placeholder="John Smith" autoComplete="name" />
                        </div>

                        <div className="form-group">
                            <label>Email address</label>
                            <input type="email" name="email" value={formData.email}
                                onChange={handleChange} required placeholder="you@company.com" autoComplete="email" />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password" value={formData.password}
                                    onChange={handleChange} required minLength="6"
                                    placeholder="Min 6 characters" autoComplete="new-password" />
                                <button type="button" className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Role toggle (hidden input, selected via left panel cards) */}
                        <div className="form-group">
                            <label>I am a</label>
                            <select name="role" value={formData.role} onChange={handleChange}>
                                <option value="CUSTOMER">👤 Customer</option>
                                <option value="AGENT">🛠️ Support Agent</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span className="auth-spinner" /> Creating account...
                                </span>
                            ) : 'Create account →'}
                        </button>
                    </form>

                    <div className="auth-divider"><span>or</span></div>

                    <div className="auth-switch">
                        Already have an account?{' '}
                        <Link to="/login">Sign in →</Link>
                    </div>

                    <Link to="/" className="auth-back-link">← Back to home</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
