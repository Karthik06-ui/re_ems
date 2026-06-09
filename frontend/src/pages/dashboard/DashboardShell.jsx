import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';
import { 
  Home, 
  BarChart2, 
  Calendar, 
  Mail, 
  Users, 
  Settings, 
  Award, 
  HelpCircle, 
  Bell, 
  Eye
} from 'lucide-react';

export default function DashboardShell({ children, sectionTitle }) {
  const { user, logout } = useAuth();
  const { chapters, activeChapter, selectChapter } = useChapter();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Analytics', path: '/dashboard/analytics/overview', icon: BarChart2 },
    { label: 'Events', path: '/dashboard/events', icon: Calendar },
    { label: 'Emails', path: '/dashboard/emails', icon: Mail },
    { label: 'Members', path: '/dashboard/members', icon: Users },
    { label: 'Settings', path: '/dashboard/settings/overview', icon: Settings },
    { label: 'Sponsors', path: '/dashboard/sponsors', icon: Award },
    { label: 'Help', path: '/dashboard/help', icon: HelpCircle },
  ];

  const isActive = (itemPath) => {
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(itemPath.split('/').slice(0, 3).join('/'));
  };

  // 1. ROLE-BASED ACCESS CONTROL GUARD
  if (!user || (user.role !== 'platform_admin' && user.role !== 'chapter_lead' && user.role !== 'organizer')) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#F8F9FA',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ 
          maxWidth: '400px', 
          backgroundColor: '#FFF', 
          padding: '32px', 
          borderRadius: '8px', 
          border: '1px solid #E8EAED',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
        }}>
          <h2 style={{ color: '#EA4335', fontSize: '20px', fontWeight: 500, margin: '0 0 12px 0' }}>Unauthorized Access</h2>
          <p style={{ color: '#5F6368', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
            Administrative or Organizer credentials are required to enter this dashboard workspace.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/auth/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Login</Link>
            <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Back Home</Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="gdg-dashboard-shell">
      {/* 1. FIXED TOP FEEDBACK BANNER */}
      <div className="gdg-feedback-banner">
        <span>Help us improve the GDG program by sharing your feedback!</span>
      </div>
      
      {/* SUB-TEXT BANNER */}
      <div className="gdg-sub-banner">
        <span>Not finding what you need? <a href="#legacy" className="blue-link underline">Switch back to the legacy dashboard</a></span>
      </div>

      <div className="gdg-dashboard-body">
        {/* 2. LEFT SIDEBAR NAVIGATION */}
        <aside className="gdg-sidebar">
          {/* Logo Section */}
          <div className="gdg-logo-section">
            {/* GDG Globe Logo simulation */}
            <div className="gdg-globe-logo">
              <span className="logo-red">●</span>
              <span className="logo-blue">●</span>
              <span className="logo-yellow">●</span>
              <span className="logo-green">●</span>
            </div>
            {/* Active Chapter Selector */}
            <div className="chapter-avatar-tile">
              <div className="avatar-square">
                {activeChapter?.name?.substring(0, 2).toUpperCase() || 'GD'}
              </div>
              <span className="avatar-label" title={activeChapter?.name || 'GDG Chapter'}>
                {activeChapter?.name ? `${activeChapter.name.substring(0, 7)}...` : 'GDG on Ca...'}
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

          {/* User profile avatar pinned at bottom */}
          <div className="gdg-sidebar-bottom">
            <div 
              className="user-circular-avatar" 
              title={`${user?.name} (${user?.role})`}
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
                  {activeChapter?.name || 'GDG on Campus Kumaraguru College of Technology - Coimbatore, Tamil Nadu, India'}
                </span>
              </h2>
            </div>
            
            <div className="gdg-header-actions">
              {/* Eye link to event page/landing */}
              <Link to="/" className="view-page-link">
                <Eye size={16} />
                <span>View page</span>
              </Link>

              {/* Chapter context switcher drop-down in top bar */}
              <select
                value={activeChapter ? activeChapter.slug : ''}
                onChange={(e) => {
                  const matched = chapters.find(c => c.slug === e.target.value);
                  if (matched) selectChapter(matched);
                }}
                className="gdg-header-dropdown"
              >
                <option value="" disabled>Select Chapter</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>

              {/* Notification bell icon */}
              <div className="bell-container cursor-pointer" title="Notifications">
                <Bell size={20} className="text-gray-600 hover:text-blue-600" />
                <span className="bell-badge"></span>
              </div>
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
