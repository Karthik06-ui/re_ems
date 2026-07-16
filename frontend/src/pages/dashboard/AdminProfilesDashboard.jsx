import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardCard } from '../../components/DashboardComponents';
import { UserCheck, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function AdminProfilesDashboard() {
  const { apiRequest } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal/Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', is_active: true });
  const [processing, setProcessing] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { status, data } = await apiRequest('/api/v1/auth/profiles/', 'GET', null, true);
      if (status === 200) {
        setProfiles(data);
      } else {
        setError(data.detail || 'Failed to fetch profiles');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (profile) => {
    setFormData({ name: profile.name, is_active: profile.is_active });
    setEditingId(profile.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/v1/auth/profiles/${editingId}/` : '/api/v1/auth/profiles/';
      
      const { status, data } = await apiRequest(url, method, formData, true);
      
      if (status === 200 || status === 201) {
        await fetchProfiles();
        resetForm();
      } else {
        alert(data.detail || data.name?.[0] || 'Failed to save profile');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete profile "${name}"? This cannot be undone.`)) return;
    
    setProcessing(true);
    try {
      const { status, data } = await apiRequest(`/api/v1/auth/profiles/${id}/`, 'DELETE', null, true);
      if (status === 204) {
        await fetchProfiles();
      } else {
        alert(data.detail || 'Failed to delete profile. It may be referenced in audit logs.');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const { status } = await apiRequest(`/api/v1/auth/profiles/${id}/`, 'PATCH', { is_active: !currentStatus }, true);
      if (status === 200) {
        fetchProfiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardShell sectionTitle="Admin Profiles">
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', padding: '40px' }}>
          <div className="gdg-spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sectionTitle="Admin Profiles">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-h)' }}>
            Committee Member Profiles
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Manage identity profiles for the shared admin account.
          </p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Profile
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(234, 67, 53, 0.1)', color: '#EA4335', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showForm && (
        <DashboardCard title={editingId ? "Edit Profile" : "Create New Profile"} style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <div className="form-group">
              <label>Profile Name (Committee Member)</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required 
                placeholder="e.g. Karthik S"
              />
            </div>
            {editingId && (
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="isActiveToggle"
                  checked={formData.is_active} 
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })} 
                />
                <label htmlFor="isActiveToggle" style={{ margin: 0 }}>Active Profile</label>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={processing}>
                {processing ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={processing}>
                Cancel
              </button>
            </div>
          </form>
        </DashboardCard>
      )}

      <DashboardCard title="All Profiles">
        <div style={{ overflowX: 'auto' }}>
          <table className="gdg-table" style={{ width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th>PROFILE NAME</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No profiles found. Create one to get started.
                  </td>
                </tr>
              ) : (
                profiles.map(profile => (
                  <tr key={profile.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '28px', height: '28px', borderRadius: '50%', 
                          backgroundColor: 'rgba(36, 134, 137, 0.1)', color: '#248689',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <UserCheck size={14} />
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{profile.name}</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleStatus(profile.id, profile.is_active)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: profile.is_active ? 'rgba(52, 168, 83, 0.15)' : 'rgba(108, 117, 125, 0.15)',
                          color: profile.is_active ? '#188038' : '#6c757d'
                        }}
                      >
                        {profile.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="gdg-share-icon-btn" onClick={() => handleEdit(profile)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="gdg-share-icon-btn" style={{ color: 'var(--gdg-error)' }} onClick={() => handleDelete(profile.id, profile.name)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </DashboardShell>
  );
}
