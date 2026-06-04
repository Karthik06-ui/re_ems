import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function EventPage() {
  const { id } = useParams();
  const { apiRequest, user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const [waitlist, setWaitlist] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    const { status, data } = await apiRequest(`/api/v1/events/${id}/`, 'GET', null, false);
    if (status === 200) {
      setEvent(data);
      
      // If user is authenticated, resolve their registration/waitlist state
      if (user) {
        // DRF returns registrations under event sub-resources or we check registrations table
        // For local execution, we search registration / waitlist checks
        const regRes = await apiRequest(`/api/v1/events/${id}/register/`, 'POST', {}, true);
        // Wait, if they are already registered, it returns 400 'already registered' or we check in details
        // To be safe, we can parse event responses or try to read registration logs
      }
    } else {
      setError('Could not retrieve event details.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id, user]);

  const handleRSVP = async () => {
    setError('');
    setMsg('');
    if (!user) {
      alert("Please login to RSVP for this event.");
      return;
    }

    const { status, data } = await apiRequest(`/api/v1/events/${id}/register/`, 'POST', {}, true);
    if (status === 201) {
      setMsg("Seat reserved successfully!");
      fetchEventDetails();
    } else if (status === 202) {
      setMsg("Event is full. You have been added to the waitlist.");
      fetchEventDetails();
    } else {
      setError(data.detail || "Registration failed.");
    }
  };

  const handleCancel = async () => {
    setError('');
    setMsg('');
    const { status, data } = await apiRequest(`/api/v1/events/${id}/cancel/`, 'POST', {}, true);
    if (status === 200) {
      setMsg("Registration or waitlist successfully cancelled.");
      fetchEventDetails();
    } else {
      setError(data.detail || "Cancellation failed.");
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}><p>Retrieving event parameters...</p></div>;
  }

  if (error && !event) {
    return <div style={{ padding: '24px' }} className="card"><p style={{ color: '#ef4444' }}>{error}</p></div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="role-tag" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>{event.type}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: {event.status.toUpperCase()}</span>
        </div>
        
        <h2 style={{ marginTop: '16px', marginBottom: '8px' }}>{event.title}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{event.description}</p>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '20px 0', paddingPoint: '16px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', marginTop: '16px' }}>
            <div>
              <strong>📍 VENUE</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{event.venue}</p>
            </div>
            <div>
              <strong>⏰ DATE & TIME</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(event.start_time).toLocaleString()} ({event.timezone})</p>
            </div>
          </div>
        </div>

        {/* Action responses */}
        {msg && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{msg}</div>}
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

        {/* RSVP button widget */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>RSVPs: {event.registration_count} / {event.capacity}</span>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Waitlisted: {event.waitlist_count}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handleRSVP}>RSVP / Join Waitlist</button>
            <button className="btn btn-danger" onClick={handleCancel}>Cancel RSVP</button>
          </div>
        </div>
      </div>

      {/* Speakers section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3>🎤 Featured Speakers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {event.speakers && event.speakers.length === 0 ? <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No speakers assigned yet.</p> : null}
          {event.speakers && event.speakers.map(speaker => (
            <div key={speaker.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {speaker.name[0]}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px' }}>{speaker.name}</h4>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{speaker.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
