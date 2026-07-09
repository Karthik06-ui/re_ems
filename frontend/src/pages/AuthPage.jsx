import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, Terminal, User as UserIcon, Key } from 'lucide-react';

export default function AuthPage() {
  const { login, logout, registerAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If there's an event ID in search params, immediately route to the participant login page
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId) {
      navigate(`/portal/login?event=${eventId}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { success, error: err } = await login(email, password);
        if (success) {
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const isAdmin = savedUser?.role === 'admin';
          
          if (!isAdmin) {
            // Deny access, clear state immediately
            logout();
            setError('Access denied. This login is reserved for Administrators/Organizers. Participants must log in via the Participant Portal.');
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          setError(err);
        }
      } else {
        const { success, error: err } = await registerAdmin(name, email, password, adminKey);
        if (success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(err);
        }
      }
    } catch (err) {
      setError('An unexpected system error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'var(--gdg-font), system-ui, sans-serif',
      backgroundColor: 'var(--gdg-content-bg)',
      boxSizing: 'border-box',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--gdg-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        padding: '36px',
        textAlign: 'left',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease'
      }}>
        {/* GDG Header Dots branding */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1b2b4b' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#248689' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#23829b' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#248689' }}></span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 6px 0', color: 'var(--text-h)' }}>
            Research and Exploration (RÉ)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {isLogin ? 'Event Operations Dashboard Sign In' : 'Create an Administrator Profile'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(234, 67, 53, 0.08)',
            border: '1px solid rgba(234, 67, 53, 0.2)',
            color: '#EA4335',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '13px',
            lineHeight: 1.4
          }}>
            <Shield size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {!isLogin && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <UserIcon size={13} /> Full Name
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Enter your name"
                required 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Mail size={13} /> Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="name@chapter.gdg.dev"
              required 
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Lock size={13} /> Password
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
              minLength={8}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Key size={13} /> Admin Registration Key
              </label>
              <input 
                type="password" 
                value={adminKey} 
                onChange={e => setAdminKey(e.target.value)} 
                placeholder="Enter secret key"
                required 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '11px', 
              fontSize: '14px', 
              borderRadius: '6px',
              backgroundColor: '#248689',
              borderColor: '#248689',
              color: '#FFF',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '6px'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register Admin')}
          </button>
        </form>

        {/* Demo Mode Action Box 
        {isLogin && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'rgba(36, 134, 137, 0.04)',
            border: '1px dashed rgba(36, 134, 137, 0.25)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
              <Terminal size={14} style={{ color: '#248689' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#248689' }}>Review & Dev Quick Access</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
              Bypass database authentication and instantly load the pre-populated dashboard with a local organizer session.
            </p>
            <button 
              type="button" 
              onClick={handleDemoMode}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #248689',
                backgroundColor: '#FFF',
                color: '#248689',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(36, 134, 137, 0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#FFF';
              }}
            >
              {loading ? 'Initializing Demo...' : 'Enter Demo Mode'}
            </button>
          </div>
        )}
        */}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Need to create an Admin profile?" : "Already have an Admin profile?"}{' '}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#248689', 
              fontWeight: 600, 
              cursor: 'pointer',
              padding: 0,
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Register here' : 'Sign In'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          Are you a participant?{' '}
          <button 
            onClick={() => navigate('/portal/login')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#248689', 
              fontWeight: 600, 
              cursor: 'pointer',
              padding: 0,
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            Go to Participant Portal
          </button>
        </p>
      </div>
    </div>
  );
}
