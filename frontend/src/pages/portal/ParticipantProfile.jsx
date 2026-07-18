import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PortalLayout from '../../components/PortalLayout';
import { AlertCircle, Save, Check } from 'lucide-react';

export default function ParticipantProfile() {
  const { apiRequest, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventRedirectId = searchParams.get('event');

  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    department: '',
    year_of_study: '',
    phone_number: '',
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const res = await apiRequest('/api/v1/auth/me/', 'GET', null, true);
      if (res.status === 200) {
        setFormData({
          name: res.data.name || '',
          roll_number: res.data.roll_number || '',
          department: res.data.department || '',
          year_of_study: res.data.year_of_study || '',
          phone_number: res.data.phone_number || '',
        });
        setEmail(res.data.email || '');
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Field validation
    if (!formData.name.trim() || !formData.roll_number.trim() || !formData.department.trim() || !formData.year_of_study.trim() || !formData.phone_number.trim()) {
      setErrorMsg('All fields are mandatory to complete your profile.');
      setSaving(false);
      return;
    }

    const res = await apiRequest('/api/v1/auth/me/', 'PATCH', formData, true);
    if (res.status === 200) {
      setSuccessMsg("Your profile details have been successfully updated!");
      await fetchProfile(); // Sync context user properties
      
      // If user came from an event registration redirect:
      if (eventRedirectId) {
        setTimeout(() => {
          navigate(`/portal/events/${eventRedirectId}`, { replace: true });
        }, 1200);
      }
    } else {
      setErrorMsg(res.data?.detail || "Failed to update profile. Please try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div className="gdg-spinner"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 0' }}>
        {eventRedirectId && (
          <div className="alert alert-warning" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(251, 188, 5, 0.08)',
            border: '1px solid rgba(251, 188, 5, 0.25)',
            color: '#B06000',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            lineHeight: 1.5
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>
              <strong>Onboarding Required:</strong> Please complete your profile details below to complete your registration request for the event.
            </span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(52, 168, 83, 0.08)',
            border: '1px solid rgba(52, 168, 83, 0.25)',
            color: '#137333',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            <Check size={20} />
            <span>{successMsg} {eventRedirectId && "Redirecting you back to register..."}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(234, 67, 53, 0.08)',
            border: '1px solid rgba(234, 67, 53, 0.25)',
            color: '#C5221F',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="gdg-card" style={{
          backgroundColor: '#FFF',
          border: '1px solid var(--gdg-border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',
          padding: '32px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 500 }}>Profile Details</h3>
          <p style={{ margin: '0 0 28px 0', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
            These details are required for participating in research events.
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gdg-text-secondary)' }}>Email Address (Read Only)</label>
              <input 
                type="email" 
                value={email} 
                disabled 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gdg-border)',
                  backgroundColor: '#F1F3F4',
                  color: 'var(--gdg-text-secondary)',
                  fontSize: '14px',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gdg-text-secondary)' }}>Full Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Enter your full name"
                required 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gdg-border)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gdg-text-secondary)' }}>Roll Number / Register ID</label>
              <input 
                type="text" 
                value={formData.roll_number} 
                onChange={e => setFormData({ ...formData, roll_number: e.target.value })} 
                placeholder="Enter your student roll number"
                required 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gdg-border)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gdg-text-secondary)' }}>Department</label>
              <input 
                type="text" 
                value={formData.department} 
                onChange={e => setFormData({ ...formData, department: e.target.value })} 
                placeholder="e.g. Computer Science and Engineering"
                required 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gdg-border)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gdg-text-secondary)' }}>Year of Study</label>
              <select 
                value={formData.year_of_study || ''} 
                onChange={e => setFormData({ ...formData, year_of_study: e.target.value })} 
                required 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gdg-border)',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#FFF'
                }}
              >
                <option value="" disabled>Select your year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Alumni">Alumni</option>
                <option value="Faculty/Staff">Faculty/Staff</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gdg-text-secondary)' }}>Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone_number} 
                onChange={e => setFormData({ ...formData, phone_number: e.target.value })} 
                placeholder="Enter your mobile number"
                required 
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gdg-border)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                marginTop: '8px',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving changes...' : 'Save and Continue'}</span>
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
