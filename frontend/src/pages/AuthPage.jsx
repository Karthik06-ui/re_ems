import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';

export default function AuthPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { success, error: err, user } = await login(email, password);
      if (success) {
        if (!user?.is_admin) {
          // Deny access, clear state immediately
          logout();
          setError('Access denied. This login is reserved for Administrators/Organizers. Participants must log in via the Participant Portal.');
        } else {
          navigate('/auth/profile-select', { replace: true });
        }
      } else {
        setError(err);
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
            Event Operations Dashboard Sign In
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
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Mail size={13} /> Admin Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@kct.ac.in"
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
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
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
