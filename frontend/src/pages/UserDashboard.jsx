import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserDashboard() {
  const { apiRequest, user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRegistrations = async () => {
    setLoading(true);
    // Fetch all events user is registered for
    const { status, data } = await apiRequest('/api/v1/events/', 'GET', null, false);
    if (status === 200) {
      // In a real application we would call an endpoint for user-specific registrations.
      // Here, we can query public lists and filter or show mock check-ins
      setRegistrations(data.slice(0, 2)); // Mock showing a couple of events
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchUserRegistrations();
    }
  }, [user]);

  if (!user) {
    return <div style={{ padding: '24px' }}><p>Please login to access your portal dashboard.</p></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="panel-header" style={{ marginBottom: '24px' }}>
        <h2>👤 Member Portal Dashboard</h2>
        <p>Manage your active event tickets, check waitlist queues, and configure profile parameters.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Tickets Grid */}
        <div>
          <h3>🎫 Your Event Tickets</h3>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '16px' }}>Loading tickets...</p>
          ) : (
            <div className="item-list">
              {registrations.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active registrations found. Register for events to generate tickets.</p>
              ) : null}
              {registrations.map(event => (
                <div key={event.id} className="list-item" style={{ background: 'var(--card-bg)' }}>
                  <div className="item-details">
                    <h4>{event.title}</h4>
                    <p style={{ marginTop: '4px' }}>📍 {event.venue} | Date: {new Date(event.start_time).toLocaleDateString()}</p>
                    <span className="role-tag" style={{ background: 'var(--success-bg)', color: 'var(--success)', marginTop: '8px', display: 'inline-block' }}>CONFIRMED SEAT</span>
                  </div>
                  {/* Mock QR checkin visual */}
                  <div style={{ textAlign: 'center', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: '#fff' }}>
                    <div style={{ width: '64px', height: '64px', background: '#000', margin: '0 auto' }}></div>
                    <span style={{ fontSize: '9px', color: '#000', display: 'block', marginTop: '4px' }}>TICKET ID: {event.id}92B</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Settings */}
        <div>
          <h3>⚙️ Profile Settings</h3>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="form-grid full">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={user.name} readOnly style={{ background: 'var(--panel-bg)' }} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={user.email} readOnly style={{ background: 'var(--panel-bg)' }} />
              </div>
              <div className="form-group">
                <label>Account Role</label>
                <input type="text" value={user.role.toUpperCase()} readOnly style={{ background: 'var(--panel-bg)', fontWeight: 'bold' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
