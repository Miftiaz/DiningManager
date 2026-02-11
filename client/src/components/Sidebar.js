import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

export default function Sidebar({ isExpanded, onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Manage Border', path: '/manage-border' },
    { label: 'Manage Feast Token', path: '/manage-feast-token' },
    { label: 'Adjust Dining Month', path: '/adjust-dining-month' },
    { label: 'Transactions', path: '/transactions' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="toggle-btn"
        onClick={() => onToggleSidebar(!isExpanded)}
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? '◀' : '▶'}
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={!isExpanded ? item.label : ''}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        ))}

        <button
          className="nav-item logout-btn"
          onClick={handleLogout}
          title={!isExpanded ? 'Logout' : ''}
        >
          <span className="nav-label">Logout</span>
        </button>
      </nav>
    </div>
  );
}
