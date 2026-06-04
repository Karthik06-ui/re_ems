import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChapterProvider, useChapter } from './contexts/ChapterContext';
import LandingPage from './pages/LandingPage';
import ChapterPage from './pages/ChapterPage';
import EventPage from './pages/EventPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import './App.css';

function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { chapters, activeChapter, selectChapter } = useChapter();
  const navigate = useNavigate();

  return (
    <div className="sandbox-container">
      {/* GLOBAL NAVBAR */}
      <header className="sandbox-header">
        <div className="header-title">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>Community Event Platform</h1>
          </Link>
          <p>Unified discovery portals, ticket bookings, forums, and campaigns</p>
        </div>

        <div className="header-status">
          {/* Active Chapter Context Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>CHAPTER:</span>
            <select
              value={activeChapter ? activeChapter.slug : ''}
              onChange={(e) => {
                const matched = chapters.find(c => c.slug === e.target.value);
                if (matched) {
                  selectChapter(matched);
                  navigate(`/chapters/${matched.slug}`);
                }
              }}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
            >
              <option value="" disabled>Select Chapter</option>
              {chapters.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: '12px' }}>
            <Link to="/" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '13px', textDecoration: 'none' }}>Discover</Link>
            {isAuthenticated ? (
              <>
                <Link to="/portal/dashboard" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '13px', textDecoration: 'none' }}>My Dashboard</Link>
                {user && (user.role === 'platform_admin' || user.role === 'chapter_lead' || user.role === 'organizer') && (
                  <Link to="/admin/dashboard" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '13px', textDecoration: 'none' }}>Admin</Link>
                )}
                <div className="session-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="role-tag">{user?.role}</span>
                  <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => { logout(); navigate('/'); }}>Logout</button>
                </div>
              </>
            ) : (
              <Link to="/auth/login" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '13px', textDecoration: 'none' }}>Login</Link>
            )}
          </nav>
        </div>
      </header>

      {/* VIEW PANEL ROUTER */}
      <main className="sandbox-body" style={{ flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chapters/:slug" element={<ChapterPage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/auth/login" element={<AuthPage />} />
          <Route path="/portal/dashboard" element={<UserDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
        Community Event Management Platform &copy; 2026. Custom Vanilla CSS & React build.
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChapterProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </ChapterProvider>
    </AuthProvider>
  );
}

export default App;
