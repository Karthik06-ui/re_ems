import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, User, Terminal } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const handleLoginRedirect = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const eventId = searchParams.get('event');
      
      if (eventId) {
        if (savedUser?.is_profile_completed) {
          navigate(`/portal/events/${eventId}`, { replace: true });
        } else {
          navigate(`/portal/profile?event=${eventId}`, { replace: true });
        }
      } else {
        const isAdmin = ['platform_admin', 'chapter_lead', 'organizer'].includes(savedUser?.role);
        if (isAdmin) {
          navigate('/dashboard', { replace: true });
        } else {
          if (savedUser?.is_profile_completed) {
            navigate('/portal', { replace: true });
          } else {
            navigate('/portal/profile', { replace: true });
          }
        }
      }
    } catch {
      navigate('/portal', { replace: true });
    }
  };

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { success, error: err } = await login(email, password);
        if (success) {
          handleLoginRedirect();
        } else {
          setError(err);
        }
      } else {
        const { success, error: err } = await register(name, email, password);
        if (success) {
          handleLoginRedirect();
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

  const handleDemoMode = async () => {
    setError('');
    setLoading(true);
    try {
      const { success } = await login('lead@kumaraguru.gdg.dev', 'password', true);
      if (success) {
        handleLoginRedirect();
      }
    } catch (err) {
      setError('Demo Mode initialization failed.');
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
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4285F4' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EA4335' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FBBC05' }}></span>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#34A853' }}></span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 6px 0', color: 'var(--text-h)' }}>
            Google Developer Groups
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {isLogin ? 'Event Operations Dashboard SignIn' : 'Create Administrative Account'}
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
                <User size={13} /> Full Name
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
                  outline: 'none'
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
                outline: 'none'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '6px' }}>
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
                outline: 'none'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '11px', 
              fontSize: '14px', 
              borderRadius: '6px',
              backgroundColor: 'var(--gdg-blue)',
              borderColor: 'var(--gdg-blue)',
              color: '#FFF',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '6px'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Demo Mode Action Box */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'rgba(26, 115, 232, 0.04)',
          border: '1px dashed rgba(26, 115, 232, 0.25)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
            <Terminal size={14} style={{ color: 'var(--gdg-blue)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gdg-blue)' }}>Review & Dev Quick Access</span>
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
              border: '1px solid var(--gdg-blue)',
              backgroundColor: '#FFF',
              color: 'var(--gdg-blue)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(26, 115, 232, 0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#FFF';
            }}
          >
            {loading ? 'Initializing Demo...' : 'Enter Demo Mode'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Need a workspace account?" : 'Already have a dashboard profile?'}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--gdg-blue)', 
              fontWeight: 600, 
              cursor: 'pointer',
              padding: 0,
              fontSize: '12px'
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
