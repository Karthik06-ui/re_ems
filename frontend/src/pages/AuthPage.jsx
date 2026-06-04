import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextRoute = searchParams.get('next') || '/';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const { success, error: err } = await login(email, password);
      if (success) {
        navigate(nextRoute);
      } else {
        setError(err);
      }
    } else {
      const { success, error: err } = await register(name, email, password);
      if (success) {
        navigate(nextRoute);
      } else {
        setError(err);
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px' }} className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
        {isLogin ? 'Welcome Back' : 'Join Community'}
      </h2>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!isLogin && (
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
        )}
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </div>

        <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '8px' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
}
