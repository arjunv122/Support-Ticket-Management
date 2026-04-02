import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="sidebar glass">
      <div className="sidebar-logo">
        <div className="logo-icon">T</div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/agent-dashboard" end className={({isActive}) => isActive ? "n-item active" : "n-item"} title="Home">
          <span className="n-icon">🏠</span>
        </NavLink>
        <NavLink to="/agent-dashboard/customers" className={({isActive}) => isActive ? "n-item active" : "n-item"} title="Customers">
          <span className="n-icon">👥</span>
        </NavLink>
        <NavLink to="/agent-dashboard/organizations" className={({isActive}) => isActive ? "n-item active" : "n-item"} title="Organizations">
          <span className="n-icon">🏢</span>
        </NavLink>
        <NavLink to="/agent-dashboard/reporting" className={({isActive}) => isActive ? "n-item active" : "n-item"} title="Reporting">
          <span className="n-icon">📊</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="n-item btn-logout-icon" title="Logout">
          <span className="n-icon">🚪</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
