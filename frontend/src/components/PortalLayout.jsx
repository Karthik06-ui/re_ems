import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LayoutDashboard, LogOut, Shield } from 'lucide-react';

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("Do you want to logout?")) {
      logout();
      navigate('/portal/login');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="gdg-dashboard-shell">
      {/* Sub-text Banner indicating user role */}
      <div className="gdg-sub-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Participant Portal Workspace</span>
          {isAdmin && (
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{ 
                fontSize: '12px', 
                background: 'none', 
                border: 'none', 
                color: 'var(--gdg-blue)',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Switch to Admin Dashboard
            </button>
          )}
        </div>
        <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>
          Role: <strong style={{ textTransform: 'uppercase' }}>{user?.role}</strong>
        </span>
      </div>

      <div className="gdg-dashboard-body">
        {/* Fixed Sidebar */}
        <aside className="gdg-sidebar">
          <div className="gdg-logo-section">
            <div className="gdg-globe-logo">
              <span className="logo-red">●</span>
              <span className="logo-blue">●</span>
              <span className="logo-yellow">●</span>
              <span className="logo-green">●</span>
            </div>
            <div className="chapter-avatar-tile">
              <div className="avatar-square" style={{ backgroundColor: 'var(--gdg-blue)', color: '#FFF' }}>
                PP
              </div>
              <span className="avatar-label" title="Participant Portal">
                Participant Portal
              </span>
            </div>
          </div>



          {/* Navigation vertical stack */}
          <nav className="gdg-nav-stack" style={{ flexGrow: 1 }}>
            <Link 
              to="/portal" 
              className={`gdg-nav-item ${location.pathname === '/portal' ? 'active' : ''}`}
            >
              <LayoutDashboard className="nav-icon" size={20} />
              <span className="nav-label">Dashboard</span>
            </Link>
            <Link 
              to="/portal/profile" 
              className={`gdg-nav-item ${location.pathname === '/portal/profile' ? 'active' : ''}`}
            >
              <User className="nav-icon" size={20} />
              <span className="nav-label">My Profile</span>
            </Link>
          </nav>

          {/* Pinned circular avatar with logout toggle */}
          <div className="gdg-sidebar-bottom">
            <div 
              className="user-circular-avatar" 
              title={`${user?.name} (Logout)`}
              onClick={handleLogout}
              style={{ cursor: 'pointer', backgroundColor: 'var(--gdg-yellow)', color: '#000' }}
            >
              {user?.name?.substring(0, 1).toUpperCase() || 'U'}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="gdg-main-content">
          <header className="gdg-content-header">
            <div className="gdg-title-section">
              <h2 className="gdg-page-title">
                Participant: <span className="font-normal text-gray-800">RÉ Workspace</span>
              </h2>
            </div>
            
            <div className="gdg-header-actions">
              <span style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                Hello, <strong>{user?.name || 'User'}</strong>
              </span>
            </div>
          </header>

          <div className="gdg-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
