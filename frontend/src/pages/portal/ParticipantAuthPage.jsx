import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, User } from 'lucide-react';

export default function ParticipantAuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginRedirect = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const eventId = searchParams.get('event');
      const isAdmin = savedUser?.role === 'admin';
      
      if (isAdmin) {
        // Dual access accounts redirect to Admin workspace first
        navigate('/dashboard', { replace: true });
      } else {
        // Standard participants
        if (eventId) {
          if (savedUser?.is_profile_completed) {
            navigate(`/portal/events/${eventId}`, { replace: true });
          } else {
            navigate(`/portal/profile?event=${eventId}`, { replace: true });
          }
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

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'var(--gdg-font), system-ui, sans-serif',
      backgroundColor: '#F8F9FA',
      boxSizing: 'border-box',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFF',
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
          <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 6px 0', color: '#248689' }}>
            RÉ Participant Portal
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {isLogin ? 'Sign in to access your profile & events' : 'Create your participant account'}
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
              placeholder="you@example.com"
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
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
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
              backgroundColor: '#248689',
              borderColor: '#248689',
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

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Need to create an account?" : 'Already have a profile?'}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
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
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <div style={{
          marginTop: '24px',
          borderTop: '1px solid var(--gdg-border)',
          paddingTop: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Are you an Organizer?{' '}
            <button 
              onClick={() => navigate('/auth/login')} 
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
              Sign In to Workspace
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
