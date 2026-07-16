import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Plus, ChevronRight, UserCircle } from 'lucide-react';

export default function AdminProfileSelect() {
  const { apiRequest, selectProfile, user, isAdmin, profileSelected, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectingId, setSelectingId] = useState(null);
  
  // Create Profile states
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [creating, setCreating] = useState(false);

  // If not admin, get out
  useEffect(() => {
    if (!isAdmin) {
      navigate('/portal/login', { replace: true });
    }
    // If already selected, maybe we are just changing profile, so don't force out, but if they came here directly, fine.
  }, [isAdmin, navigate]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { status, data } = await apiRequest('/api/v1/auth/profiles/');
      if (status === 200) {
        setProfiles(data);
      } else {
        setError(data.detail || 'Failed to load profiles');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [apiRequest, isAdmin]);

  const handleSelectProfile = async (profileId) => {
    if (selectingId) return;
    
    setSelectingId(profileId);
    setError('');
    
    try {
      const { success, error: err } = await selectProfile(profileId);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(err || 'Failed to select profile');
        setSelectingId(null);
      }
    } catch (err) {
      setError('An error occurred during profile selection');
      setSelectingId(null);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const { status, data } = await apiRequest('/api/v1/auth/profiles/', 'POST', {
        name: newProfileName,
        is_active: true
      }, true);

      if (status === 201) {
        setIsAddingProfile(false);
        setNewProfileName('');
        await fetchProfiles();
        // Auto-select the newly created profile
        handleSelectProfile(data.id);
      } else {
        setError(data.detail || data.name?.[0] || 'Failed to create profile');
        setCreating(false);
      }
    } catch (err) {
      setError('Error creating profile');
      setCreating(false);
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
        maxWidth: '500px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--gdg-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        padding: '36px',
        textAlign: 'left',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(36, 134, 137, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px auto',
            color: '#248689'
          }}>
            <Users size={24} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 8px 0', color: 'var(--text-h)' }}>
            Select Your Profile
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Who is using the administrator dashboard today?
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
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
              Loading profiles...
            </div>
          ) : isAddingProfile || profiles.length === 0 ? (
            <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Profile Name</label>
                <input 
                  type="text" 
                  value={newProfileName} 
                  onChange={e => setNewProfileName(e.target.value)} 
                  placeholder="e.g. Karthik"
                  required
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={creating}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#248689', color: '#FFF' }}
                >
                  {creating ? 'Creating...' : 'Create & Continue'}
                </button>
                {profiles.length > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsAddingProfile(false)}
                    disabled={creating}
                    style={{ padding: '12px', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <>
              {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                disabled={!profile.is_active || selectingId !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: profile.is_active ? 'var(--input-bg)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${selectingId === profile.id ? '#248689' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  cursor: profile.is_active && !selectingId ? 'pointer' : 'not-allowed',
                  opacity: profile.is_active ? 1 : 0.6,
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  if (profile.is_active && !selectingId) {
                    e.currentTarget.style.borderColor = '#248689';
                    e.currentTarget.style.backgroundColor = 'rgba(36, 134, 137, 0.02)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectingId !== profile.id) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = profile.is_active ? 'var(--input-bg)' : 'rgba(0,0,0,0.02)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e9ecef', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#6c757d'
                  }}>
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {profile.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {profile.department} {profile.role ? `• ${profile.role}` : ''}
                    </p>
                  </div>
                </div>
                
                <div style={{ color: selectingId === profile.id ? '#248689' : '#adb5bd' }}>
                  {selectingId === profile.id ? (
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Selecting...</span>
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </button>
              ))}
              
              {/* Add Profile Button */}
              <button
                onClick={() => setIsAddingProfile(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'transparent',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  color: 'var(--text-secondary)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#248689';
                  e.currentTarget.style.color = '#248689';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(0,0,0,0.04)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <Plus size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
                  Add New Profile
                </h3>
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={() => {
              logout();
              navigate('/auth/login');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancel and Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
