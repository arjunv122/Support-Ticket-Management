import React, { useEffect, useState } from 'react';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('tf_theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            setIsDark(false);
            document.documentElement.removeAttribute('data-theme');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('tf_theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('tf_theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {isDark ? '🌙' : '☀️'}
        </button>
    );
};

export default ThemeToggle;
