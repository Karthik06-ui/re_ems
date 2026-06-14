import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { 
  Home, 
  BarChart2, 
  Calendar, 
  CheckSquare, 
  Users, 
  Send, 
  Award, 
  Settings, 
  Bell
} from 'lucide-react';
import { NotificationDrawer } from '../../components/DashboardComponents';

export default function DashboardShell({ children, sectionTitle }) {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'Event Published', message: 'Era of Infinite Software event is now live!', time: '10m ago', unread: true },
    { id: 2, type: 'Registration Milestone', message: 'React Summit reached 80% capacity!', time: '1h ago', unread: true },
    { id: 3, type: 'Waitlist Promotion', message: 'FIFO Promotion: karthik@gdgdemo.org promoted to confirmed!', time: '2h ago', unread: false },
    { id: 4, type: 'Sponsor Added', message: 'JetBrains added to Silver Tier placements.', time: '1d ago', unread: false }
  ]);

  // Menu structure matching the official specification
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Analytics', path: '/dashboard/analytics/overview', icon: BarChart2 },
    { label: 'Events', path: '/dashboard/events', icon: Calendar },
    { label: 'Registrations', path: '/dashboard/registrations', icon: CheckSquare },
    { label: 'Members', path: '/dashboard/members', icon: Users },
    { label: 'Campaigns', path: '/dashboard/campaigns', icon: Send },
    { label: 'Sponsors', path: '/dashboard/sponsors', icon: Award },
    { label: 'Settings', path: '/dashboard/settings/overview', icon: Settings },
  ];

  const isActive = (itemPath) => {
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    // Route match check
    return location.pathname.startsWith(itemPath.split('/').slice(0, 3).join('/'));
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // 1. ROLE-BASED ACCESS CONTROL GUARD
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="gdg-dashboard-shell">
      {/* 1. FIXED TOP FEEDBACK BANNER */}
      <div className="gdg-feedback-banner">
        <span>Help us improve the GDG program by sharing your feedback!</span>
      </div>
      
      {/* SUB-TEXT BANNER */}
      <div className="gdg-sub-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Not finding what you need? <a href="#legacy" className="blue-link underline">Switch back to the legacy dashboard</a></span>
        <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>Role: <strong style={{ textTransform: 'uppercase' }}>{user.role}</strong></span>
      </div>

      <div className="gdg-dashboard-body">
        {/* 2. FIXED SIDEBAR */}
        <aside className="gdg-sidebar">
          <div className="gdg-logo-section">
            <div className="gdg-globe-logo">
              <span className="logo-red">●</span>
              <span className="logo-blue">●</span>
              <span className="logo-yellow">●</span>
              <span className="logo-green">●</span>
            </div>
            <div className="chapter-avatar-tile">
              <div className="avatar-square">
                GD
              </div>
              <span className="avatar-label" title="GDG Workspace">
                GDG Workspace
              </span>
            </div>
          </div>

          {/* Navigation vertical stack */}
          <nav className="gdg-nav-stack">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link 
                  key={item.label} 
                  to={item.path} 
                  className={`gdg-nav-item ${active ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" size={20} />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Pinned circular avatar */}
          <div className="gdg-sidebar-bottom">
            <div 
              className="user-circular-avatar" 
              title={`${user?.name} (Logout)`}
              onClick={() => {
                if (window.confirm('Do you want to logout?')) {
                  logout();
                  navigate('/');
                }
              }}
            >
              {user?.name?.substring(0, 1).toUpperCase() || 'U'}
            </div>
          </div>
        </aside>

        {/* 3. CONTENT AREA */}
        <main className="gdg-main-content">
          <header className="gdg-content-header">
            <div className="gdg-title-section">
              <h2 className="gdg-page-title">
                {sectionTitle ? `${sectionTitle}: ` : ''}
                  <span className="font-normal text-gray-800">
                    GDG Workspace
                  </span>
              </h2>
            </div>
            
            <div className="gdg-header-actions">


              {/* Notification Bell */}
              <div 
                className="bell-container cursor-pointer" 
                title="Chapter Alerts"
                onClick={() => setNotificationOpen(true)}
              >
                <Bell size={20} className="text-gray-600 hover:text-blue-600" />
                {unreadCount > 0 && <span className="bell-badge"></span>}
              </div>
            </div>
          </header>

          <div className="gdg-content-inner">
            {children}
          </div>
        </main>
      </div>

      {/* GLOBAL NOTIFICATION CENTER DRAWER */}
      <NotificationDrawer 
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
      />

    </div>
  );
}
