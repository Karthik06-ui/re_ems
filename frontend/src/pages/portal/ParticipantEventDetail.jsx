import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ParticipantEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiRequest, user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchEventDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    const res = await apiRequest(`/api/v1/events/${id}/`, 'GET', null, true);
    if (res.status === 200) {
      setEvent(res.data);
    } else {
      setErrorMsg(res.data?.detail || 'The event details could not be retrieved.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleRegister = async () => {
    // Force onboarding profile completion check
    if (!user?.is_profile_completed) {
      navigate(`/portal/profile?event=${id}`);
      return;
    }

    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/${id}/register/`, 'POST', {}, true);
    if (res.status === 201 || res.status === 202) {
      alert(res.data.detail || "Registration successful!");
      fetchEventDetails();
    } else {
      alert(res.data.detail || "Failed to complete registration.");
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your seat/waitlist position?")) return;
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/${id}/cancel/`, 'POST', {}, true);
    if (res.status === 200) {
      alert(res.data.detail || "Successfully cancelled.");
      fetchEventDetails();
    } else {
      alert(res.data.detail || "Failed to cancel registration.");
    }
    setActionLoading(false);
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

  if (errorMsg || !event) {
    return (
      <PortalLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--gdg-error)', fontWeight: 500 }}>{errorMsg || 'Event not found.'}</p>
          <Link to="/portal" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Back to Dashboard
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const isConfirmed = event.user_status?.type === 'registration' && event.user_status?.status !== 'cancelled';
  const isWaitlisted = event.user_status?.type === 'waitlist';
  const isFull = event.registration_count >= event.capacity;

  return (
    <PortalLayout>
      <div style={{ padding: '12px 0 40px 0' }}>
        {/* Back Link */}
        <Link to="/portal" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--gdg-text-secondary)',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '20px'
        }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Hero Cover Card */}
        <div style={{
          width: '100%',
          height: '220px',
          background: event.cover_image ? `url(${event.cover_image}) center/cover no-repeat` : 'linear-gradient(135deg, var(--gdg-blue) 0%, #7C4DFF 100%)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '32px',
          boxSizing: 'border-box',
          boxShadow: 'var(--shadow)',
          marginBottom: '28px'
        }}>
          {event.cover_image && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              zIndex: 1
            }}></div>
          )}
          
          <div style={{ zIndex: 10, color: '#FFF' }}>
            <span style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              color: '#FFF', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              padding: '4px 10px', 
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {event.category || 'workshop'} • {event.type}
            </span>
            <h1 style={{ fontSize: '28px', margin: '10px 0 4px 0', color: '#FFF', fontWeight: 600, letterSpacing: '-0.5px' }}>
              {event.title}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} />
              {new Date(event.start_time).toLocaleString()} ({event.timezone})
            </p>
          </div>
        </div>

        {/* Grid Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '7fr 3fr',
          gap: '28px'
        }}>
          {/* Main Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="gdg-card" style={{
              backgroundColor: '#FFF',
              border: '1px solid var(--gdg-border)',
              borderRadius: '12px',
              padding: '28px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 500 }}>About this Event</h3>
              <p style={{ 
                fontSize: '14px', 
                lineHeight: 1.6, 
                color: 'var(--gdg-text-secondary)',
                whiteSpace: 'pre-wrap',
                margin: 0
              }}>
                {event.description || 'No description provided.'}
              </p>
            </div>

            {/* Sessions List */}
            <div className="gdg-card" style={{
              backgroundColor: '#FFF',
              border: '1px solid var(--gdg-border)',
              borderRadius: '12px',
              padding: '28px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 500 }}>Sessions & Schedule</h3>
              {event.sessions && event.sessions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {event.sessions.map((s, idx) => (
                    <div key={s.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '10px',
                      borderBottom: idx === event.sessions.length - 1 ? 'none' : '1px solid var(--gdg-border)'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 500 }}>{s.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>Track: {s.track || 'General'}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--gdg-blue)', fontWeight: 600 }}>{s.duration}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                  No sessions announced for this event yet.
                </p>
              )}
            </div>

            {/* Speakers List */}
            <div className="gdg-card" style={{
              backgroundColor: '#FFF',
              border: '1px solid var(--gdg-border)',
              borderRadius: '12px',
              padding: '28px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 500 }}>Speakers</h3>
              {event.speakers && event.speakers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {event.speakers.map(sp => (
                    <div key={sp.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <img 
                        src={sp.avatar || 'https://i.pravatar.cc/100?img=9'} 
                        alt={sp.name} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--gdg-border)' }} 
                      />
                      <div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600 }}>{sp.name}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--gdg-text-secondary)', lineHeight: 1.4 }}>{sp.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                  Speakers will be announced soon.
                </p>
              )}
            </div>
          </div>

          {/* Action Sidebar */}
          <div>
            <div className="gdg-card" style={{
              backgroundColor: '#FFF',
              border: '1px solid var(--gdg-border)',
              borderRadius: '12px',
              padding: '24px',
              position: 'sticky',
              top: '90px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Registration Status</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                  <MapPin size={15} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                  <span>{event.venue || 'Virtual / Online'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                  <Clock size={15} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                  <span>Time: {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                  <Users size={15} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                  <span>Bookings: {event.registration_count} / {event.capacity}</span>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--gdg-border)', margin: 0 }} />

              {/* Status Display */}
              {isConfirmed && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  backgroundColor: 'rgba(52, 168, 83, 0.08)',
                  border: '1px solid rgba(52, 168, 83, 0.2)',
                  color: '#137333',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <CheckCircle size={16} />
                  <span>Registered (Confirmed)</span>
                </div>
              )}

              {isWaitlisted && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  backgroundColor: 'rgba(251, 188, 5, 0.08)',
                  border: '1px solid rgba(251, 188, 5, 0.2)',
                  color: '#B06000',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <AlertCircle size={16} />
                  <span>On Waitlist (Pos {event.user_status.position})</span>
                </div>
              )}

              {/* Action Button */}
              {isConfirmed || isWaitlisted ? (
                <button 
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px' }}
                >
                  {actionLoading ? 'Processing...' : 'Cancel Registration'}
                </button>
              ) : (
                <button 
                  onClick={handleRegister}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    backgroundColor: 'var(--gdg-blue)',
                    color: '#FFF',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Processing...' : (isFull ? 'Join Waitlist' : 'Register Now')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
