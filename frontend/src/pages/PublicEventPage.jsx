import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function PublicEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, apiRequest, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchEventDetails = async () => {
    setLoading(true);
    const { status, data } = await apiRequest(`/api/v1/events/${id}/`, 'GET', null, true);
    if (status === 200) {
      setEvent(data);
      setErrorMsg('');
    } else {
      setEvent(null);
      setErrorMsg(data.detail || 'The event you are looking for does not exist or has been deleted.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate(`/portal/login?next=/events/${id}`);
      return;
    }
    setSubmitting(true);
    const { status, data } = await apiRequest(`/api/v1/events/${id}/register/`, 'POST', {}, true);
    if (status === 201 || status === 202) {
      alert(data.detail || 'Registration successful!');
      fetchEventDetails();
    } else {
      alert(data.detail || 'Failed to complete registration.');
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your seat/waitlist position?')) return;
    setSubmitting(true);
    const { status, data } = await apiRequest(`/api/v1/events/${id}/cancel/`, 'POST', {}, true);
    if (status === 200) {
      alert(data.detail || 'Successfully cancelled.');
      fetchEventDetails();
    } else {
      alert(data.detail || 'Failed to cancel registration.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'var(--gdg-font), system-ui, sans-serif',
        backgroundColor: 'var(--gdg-content-bg)'
      }}>
        <div className="gdg-spinner" style={{ width: '40px', height: '40px' }}></div>
        <span style={{ marginTop: '16px', color: 'var(--gdg-text-secondary)', fontSize: '14px' }}>Loading event details...</span>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'var(--gdg-font), system-ui, sans-serif',
        backgroundColor: 'var(--gdg-content-bg)',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '480px',
          backgroundColor: '#FFF',
          border: '1px solid var(--gdg-border)',
          borderRadius: '12px',
          padding: '36px',
          textAlign: 'center',
          boxShadow: 'var(--shadow)'
        }}>
          <ShieldAlert size={48} style={{ color: 'var(--gdg-error)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 12px 0' }}>Access Denied or Event Not Found</h2>
          <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            {errorMsg || 'We could not fetch details for this event. It might still be a draft, or is restricted to administrators.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
            <Link to="/portal/login" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = event.user_status?.type === 'registration' && event.user_status?.status !== 'cancelled';
  const isWaitlisted = event.user_status?.type === 'waitlist';
  const isFull = event.registration_count >= event.capacity;
  const isRegistrationClosed = event.status === 'registration closed' || event.status === 'completed' || event.status === 'archived';

  return (
    <div style={{
      fontFamily: 'var(--gdg-font), system-ui, sans-serif',
      backgroundColor: 'var(--gdg-content-bg)',
      color: 'var(--gdg-text-primary)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      {/* Top Navbar */}
      <header style={{
        width: '100%',
        backgroundColor: '#FFF',
        borderBottom: '1px solid var(--gdg-border)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4285F4' }}></span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EA4335' }}></span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FBBC05' }}></span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34A853' }}></span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gdg-text-secondary)' }}>Research and Exploration (RÉ)</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            <>
              {user && (
                <Link to={`/dashboard/events/${event.id}/overview`} className="blue-link" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Admin Workspace</span>
                  <ExternalLink size={13} />
                </Link>
              )}
              <span style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Signed in as <strong>{user.name}</strong></span>
            </>
          ) : (
            <Link to={`/portal/login?next=/events/${id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Cover Card / Header Banner */}
      <div style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '24px auto 0',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          height: '240px',
          background: event.cover_image ? `url(${event.cover_image}) center/cover no-repeat` : 'linear-gradient(135deg, #1A73E8 0%, #7C4DFF 100%)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '32px',
          boxSizing: 'border-box',
          boxShadow: 'var(--shadow)'
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
          {/* Subtle logo backgrounds */}
          {!event.cover_image && (
            <>
              <div style={{ position: 'absolute', top: '20px', right: '30px', fontSize: '120px', opacity: 0.15, userSelect: 'none', color: '#FFF' }}>●</div>
              <div style={{ position: 'absolute', bottom: '-20px', left: '20%', fontSize: '80px', opacity: 0.1, userSelect: 'none', color: '#FFF' }}>●</div>
            </>
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
              {(event.category || 'workshop').toUpperCase()} • {event.type.toUpperCase()}
            </span>
            <h1 style={{ fontSize: '32px', margin: '12px 0 4px 0', color: '#FFF', fontWeight: 600, letterSpacing: '-0.5px', textAlign: 'left' }}>
              {event.title}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} />
              {new Date(event.start_time).toLocaleString()} ({event.timezone})
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content Layout */}
      <main style={{
        width: '100%',
        maxWidth: '1100px',
        padding: '24px 16px 60px 16px',
        display: 'grid',
        gridTemplateColumns: '7fr 3fr',
        gap: '24px',
        boxSizing: 'border-box',
        textAlign: 'left'
      }}>
        
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Event Details Card */}
          <div style={{
            backgroundColor: '#FFF',
            border: '1px solid var(--gdg-border)',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 500, color: 'var(--gdg-text-primary)' }}>
              About this Event
            </h3>
            <p style={{ 
              fontSize: '15px', 
              lineHeight: 1.6, 
              color: 'var(--gdg-text-secondary)',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {event.description || 'Join us for this hands-on workshop led by industry speakers and Google Developer Experts. Learn modern best practices, collaborate with fellow developers, and expand your technical skill sets.'}
            </p>
          </div>

          {/* Speakers Section */}
          <div style={{
            backgroundColor: '#FFF',
            border: '1px solid var(--gdg-border)',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 500, color: 'var(--gdg-text-primary)' }}>
              Speakers
            </h3>
            {event.speakers && event.speakers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {event.speakers.map(sp => (
                  <div key={sp.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <img 
                      src={sp.avatar || 'https://i.pravatar.cc/100?img=9'} 
                      alt={sp.name} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--gdg-border)' }} 
                    />
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>{sp.name}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--gdg-text-secondary)', lineHeight: 1.5 }}>{sp.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                Speaker information will be announced shortly.
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Registration Panel / Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Glassmorphic/Premium Action Card */}
          <div style={{
            backgroundColor: '#FFF',
            border: '1px solid var(--gdg-border)',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: 'var(--shadow)',
            position: 'sticky',
            top: '90px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--gdg-text-primary)' }}>
              Registration Details
            </h3>

            {/* Quick Metadata list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                <MapPin size={15} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                <span>{event.venue || 'Online/Virtual'}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                <Clock size={15} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                <Users size={15} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                <span>Seating: {event.registration_count} / {event.capacity} booked</span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--gdg-border)', margin: '0 0 20px 0' }} />

            {/* Status Feedback Panel */}
            {isConfirmed && (
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                backgroundColor: 'rgba(52, 168, 83, 0.08)',
                border: '1px solid rgba(52, 168, 83, 0.25)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--gdg-success)',
                fontSize: '13px',
                marginBottom: '16px',
                fontWeight: 500
              }}>
                <CheckCircle2 size={16} />
                <span>You're registered for this event!</span>
              </div>
            )}

            {isWaitlisted && (
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                backgroundColor: 'rgba(249, 171, 0, 0.08)',
                border: '1px solid rgba(249, 171, 0, 0.25)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--gdg-draft)',
                fontSize: '13px',
                marginBottom: '16px',
                fontWeight: 500
              }}>
                <AlertCircle size={16} />
                <span>Waitlisted (Position: {event.user_status.position})</span>
              </div>
            )}

            {/* Main Action buttons */}
            {isRegistrationClosed ? (
              <button 
                disabled 
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--gdg-completed)',
                  color: '#FFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'not-allowed'
                }}
              >
                Registration Closed
              </button>
            ) : isConfirmed || isWaitlisted ? (
              <button 
                onClick={handleCancel}
                disabled={submitting}
                className="btn btn-danger"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {submitting ? 'Updating...' : (isWaitlisted ? 'Leave Waitlist' : 'Cancel Ticket')}
              </button>
            ) : (
              <button 
                onClick={handleRegister}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--gdg-blue)',
                  color: '#FFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Booking...' : (isFull ? 'Join Waitlist' : 'Register Now')}
              </button>
            )}

            {!isAuthenticated && (
              <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: 'var(--gdg-text-secondary)', textAlign: 'center' }}>
                * Sign-in required to request reservation.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
