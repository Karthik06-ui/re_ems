import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChapter } from '../contexts/ChapterContext';

export default function AdminDashboard() {
  const { apiRequest, user } = useAuth();
  const { activeChapter, chapters } = useChapter();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState('overview');

  // Directory lists
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Forms inputs
  const [evTitle, setEvTitle] = useState('Web Performance Summit 2026');
  const [evDesc, setEvDesc] = useState('Optimize site speeds, layouts, and lighthouse metrics.');
  const [evType, setEvType] = useState('physical');
  const [evCapacity, setEvCapacity] = useState('100');
  const [evVenue, setEvVenue] = useState('Seattle Conference Hall');

  const [spName, setSpName] = useState('Vercel');
  const [spWebsite, setSpWebsite] = useState('https://vercel.com');
  const [spTier, setSpTier] = useState('gold');

  const [cpSubject, setCpSubject] = useState('Announcing developer meetups');
  const [cpBody, setCpBody] = useState('Check out our event pipeline and RSVP online.');
  const [cpAudience, setCpAudience] = useState('all');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchAdminData = async () => {
    if (!activeChapter) return;
    setMsg('');
    setErr('');

    if (activeAdminSubTab === 'overview' || activeAdminSubTab === 'analytics') {
      const { status, data } = await apiRequest(`/api/v1/analytics/overview/?chapter=${activeChapter.slug}`, 'GET', null, true);
      if (status === 200) setAnalytics(data);
    }
    if (activeAdminSubTab === 'events') {
      const { status, data } = await apiRequest(`/api/v1/events/?chapter=${activeChapter.slug}`, 'GET', null, true);
      if (status === 200) setEvents(data);
    }
    if (activeAdminSubTab === 'sponsors') {
      const { status, data } = await apiRequest('/api/v1/sponsors/', 'GET', null, true);
      if (status === 200) setSponsors(data.filter(s => s.chapter === activeChapter.id));
    }
    if (activeAdminSubTab === 'campaigns') {
      const { status, data } = await apiRequest('/api/v1/campaigns/', 'GET', null, true);
      if (status === 200) setCampaigns(data.filter(c => c.chapter === activeChapter.id));
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeAdminSubTab, activeChapter]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    const start_time = new Date();
    start_time.setDate(start_time.getDate() + 2);
    const end_time = new Date(start_time.getTime() + 3 * 60 * 60 * 1000);

    const { status, data } = await apiRequest('/api/v1/events/', 'POST', {
      chapter: activeChapter.id,
      title: evTitle,
      description: evDesc,
      type: evType,
      capacity: parseInt(evCapacity),
      venue: evVenue,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      timezone: 'UTC',
      status: 'published'
    }, true);

    if (status === 201) {
      setMsg('Event published successfully!');
      setActiveAdminSubTab('events');
    } else {
      setErr(data.detail || 'Failed to publish event.');
    }
  };

  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    const { status } = await apiRequest('/api/v1/sponsors/', 'POST', {
      chapter: activeChapter.id,
      name: spName,
      website: spWebsite,
      tier: spTier
    }, true);

    if (status === 201) {
      setMsg('Sponsor added to directory.');
      setActiveAdminSubTab('sponsors');
    } else {
      setErr('Failed to add sponsor.');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    const { status } = await apiRequest('/api/v1/campaigns/', 'POST', {
      chapter: activeChapter.id,
      subject: cpSubject,
      body: cpBody,
      audience: cpAudience
    }, true);

    if (status === 201) {
      setMsg('Email campaign draft saved.');
      setActiveAdminSubTab('campaigns');
    } else {
      setErr('Failed to save campaign draft.');
    }
  };

  const handleSendCampaign = async (campaignId) => {
    setMsg('');
    const { status } = await apiRequest(`/api/v1/campaigns/${campaignId}/send/`, 'POST', {}, true);
    if (status === 200) {
      setMsg('Campaign emails dispatched successfully!');
      fetchAdminData();
    }
  };

  if (!user || user.role === 'member') {
    return <div style={{ padding: '24px' }}><p style={{ color: '#ef4444' }}>Unauthorized. Administrative privileges required.</p></div>;
  }

  if (!activeChapter) {
    return <div style={{ padding: '24px' }}><p>Please select a chapter context in the sidebar to configure settings.</p></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="panel-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>🏢 Chapter Workspace Panel</h2>
          <p>Administer regional configs, events, campaigns, directories, and telemetry metrics.</p>
        </div>
        <span className="role-tag">{activeChapter.name}</span>
      </div>

      {/* Sub tabs navigations */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button className={`btn ${activeAdminSubTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveAdminSubTab('overview')}>📊 Metrics</button>
        <button className={`btn ${activeAdminSubTab === 'events' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveAdminSubTab('events')}>📅 Events Builder</button>
        <button className={`btn ${activeAdminSubTab === 'sponsors' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveAdminSubTab('sponsors')}>🤝 Sponsor Director</button>
        <button className={`btn ${activeAdminSubTab === 'campaigns' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveAdminSubTab('campaigns')}>✉️ Campaigns</button>
      </div>

      {msg && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{msg}</div>}
      {err && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{err}</div>}

      {/* Sub tab contents */}
      {activeAdminSubTab === 'overview' && analytics && (
        <div className="card">
          <h3>Telemetry Chapter Analytics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TOTAL MEMBERS</span>
              <h2 style={{ margin: '8px 0 0', color: 'var(--primary)' }}>{analytics.total_members}</h2>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TOTAL EVENTS</span>
              <h2 style={{ margin: '8px 0 0', color: 'var(--primary)' }}>{analytics.total_events}</h2>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TOTAL RSVPS</span>
              <h2 style={{ margin: '8px 0 0', color: 'var(--primary)' }}>{analytics.total_registrations}</h2>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ATTENDANCE RATE</span>
              <h2 style={{ margin: '8px 0 0', color: 'var(--primary)' }}>{analytics.engagement_metrics.attendance_rate}%</h2>
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Builder form */}
          <div className="card">
            <h3>Publish New Event</h3>
            <form onSubmit={handleCreateEvent}>
              <div className="form-grid full">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Venue Location</label>
                  <input type="text" value={evVenue} onChange={e => setEvVenue(e.target.value)} required />
                </div>
              </div>
              <div className="form-grid" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label>Capacity</label>
                  <input type="number" value={evCapacity} onChange={e => setEvCapacity(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={evType} onChange={e => setEvType(e.target.value)}>
                    <option value="physical">Physical</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '12px', marginBottom: '16px' }}>
                <label>Description Details</label>
                <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} rows={2} required></textarea>
              </div>
              <button className="btn btn-primary" type="submit">Publish Event</button>
            </form>
          </div>

          {/* Active list */}
          <div className="card">
            <h3>Active Events ({events.length})</h3>
            <div className="item-list">
              {events.map(event => (
                <div className="list-item" key={event.id}>
                  <div className="item-details">
                    <h4>{event.title}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>RSVPs: {event.registration_count} / {event.capacity} | status: {event.status}</p>
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px' }} onClick={async () => {
                    const email = prompt("Enter attendee email address to check-in:");
                    if (email) {
                      await apiRequest(`/api/v1/events/${event.id}/checkin/`, 'POST', { email }, true);
                    }
                  }}>Check-in</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'sponsors' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3>Add Sponsor Record</h3>
            <form onSubmit={handleCreateSponsor}>
              <div className="form-grid full">
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" value={spName} onChange={e => setSpName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Website URL</label>
                  <input type="url" value={spWebsite} onChange={e => setSpWebsite(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Tier</label>
                  <select value={spTier} onChange={e => setSpTier(e.target.value)}>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} type="submit">Save Sponsor</button>
            </form>
          </div>

          <div className="card">
            <h3>Sponsor Directory</h3>
            <div className="item-list">
              {sponsors.map(sp => (
                <div className="list-item" key={sp.id}>
                  <div className="item-details">
                    <h4>{sp.name}</h4>
                    <p>{sp.website} | Tier: {sp.tier}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'campaigns' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3>Create Campaign</h3>
            <form onSubmit={handleCreateCampaign}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" value={cpSubject} onChange={e => setCpSubject(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Audience</label>
                  <select value={cpAudience} onChange={e => setCpAudience(e.target.value)}>
                    <option value="all">All Members</option>
                    <option value="registrants">Confirmed Registrants</option>
                    <option value="waitlist">Waitlist</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '12px', marginBottom: '16px' }}>
                <label>Body</label>
                <textarea value={cpBody} onChange={e => setCpBody(e.target.value)} rows={3} required></textarea>
              </div>
              <button className="btn btn-primary" type="submit">Save Draft</button>
            </form>
          </div>

          <div className="card">
            <h3>Active Campaigns</h3>
            <div className="item-list">
              {campaigns.map(cp => (
                <div className="list-item" key={cp.id}>
                  <div className="item-details">
                    <h4>{cp.subject}</h4>
                    <p>Audience: {cp.audience} | Status: {cp.status}</p>
                  </div>
                  <button className="btn btn-success" onClick={() => handleSendCampaign(cp.id)} disabled={cp.status === 'sent'}>Dispatch</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
