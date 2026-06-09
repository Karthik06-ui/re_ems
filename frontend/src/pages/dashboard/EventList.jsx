import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  Plus, Calendar, Monitor, Users, CheckSquare, Edit, ExternalLink, Copy, Trash
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function EventList() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showTest, setShowTest] = useState(false);
  const [showHidden, setShowHidden] = useState(true);

  // Form parameters for quick new event creation
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('New Developer workshop');
  const [newVenue, setNewVenue] = useState('Google Meet');
  const [newCapacity, setNewCapacity] = useState('100');

  const fetchEvents = async () => {
    if (!activeChapter) return;
    setLoading(true);
    // Fetch all events for chapter
    const { status, data } = await apiRequest(`/api/v1/events/?chapter=${activeChapter.slug}`, 'GET', null, true);
    if (status === 200) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [activeChapter]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!activeChapter) return;

    const start_time = new Date();
    start_time.setDate(start_time.getDate() + 5);
    const end_time = new Date(start_time.getTime() + 2 * 60 * 60 * 1000);

    const { status } = await apiRequest('/api/v1/events/', 'POST', {
      chapter: activeChapter.id,
      title: newTitle,
      description: 'Join us for a hands-on developer training workshop to review code architecture patterns, libraries, and frameworks.',
      type: 'physical',
      capacity: parseInt(newCapacity),
      venue: newVenue,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      timezone: 'GMT+5:30',
      status: 'draft'
    }, true);

    if (status === 201) {
      setCreating(false);
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event draft?')) return;
    const { status } = await apiRequest(`/api/v1/events/${id}/`, 'DELETE', null, true);
    if (status === 204 || status === 200) {
      fetchEvents();
    }
  };

  const getStatusColor = (statusVal) => {
    switch (statusVal.toLowerCase()) {
      case 'draft': return '#F9AB00';
      case 'completed': return '#9AA0A6';
      case 'published': return '#34A853';
      default: return '#9AA0A6';
    }
  };

  // Filter events based on UI switches
  const filteredEvents = events.filter(e => {
    if (statusFilter !== 'All' && e.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <DashboardShell sectionTitle="Events">
      
      {/* Header quick create actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button 
          onClick={() => setCreating(prev => !prev)} 
          className="btn" 
          style={{ backgroundColor: '#202124', color: '#FFFFFF', borderRadius: '24px', padding: '10px 20px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>New event</span>
        </button>
      </div>

      {/* New Event Form drawer block */}
      {creating && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3>Publish New Event Draft</h3>
          <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Event Title</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Venue / Location</label>
                <input type="text" value={newVenue} onChange={e => setNewVenue(e.target.value)} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Seating Capacity</label>
                <input type="number" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} required />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Create Event Draft</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="gdg-filters-bar">
        <div className="gdg-filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="gdg-header-dropdown"
            style={{ fontWeight: 500 }}
          >
            <option value="All">All events ({events.length})</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Show test</span>
            <button 
              onClick={() => setShowTest(!showTest)} 
              className={`gdg-share-icon-btn ${showTest ? 'active' : ''}`}
              style={{ width: '36px', height: '20px', borderRadius: '10px', position: 'relative', background: showTest ? 'var(--gdg-blue)' : '#C4C7C5' }}
            >
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFF', display: 'block', position: 'absolute', top: '2px', left: showTest ? '18px' : '2px', transition: 'left 0.2s' }}></span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Show hidden</span>
            <button 
              onClick={() => setShowHidden(!showHidden)} 
              className={`gdg-share-icon-btn ${showHidden ? 'active' : ''}`}
              style={{ width: '36px', height: '20px', borderRadius: '10px', position: 'relative', background: showHidden ? 'var(--gdg-blue)' : '#C4C7C5' }}
            >
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFF', display: 'block', position: 'absolute', top: '2px', left: showHidden ? '18px' : '2px', transition: 'left 0.2s' }}></span>
            </button>
          </div>
        </div>
      </div>

      {/* EVENTS CARD LIST */}
      {loading ? (
        <div className="gdg-spinner-container">
          <div className="gdg-spinner"></div>
          <span>Loading event list...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--gdg-text-secondary)', fontStyle: 'italic' }}>No events found matches the filter selection.</p>
            </div>
          ) : null}
          
          {filteredEvents.map(event => (
            <div key={event.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', padding: '20px', minHeight: '180px', boxSizing: 'border-box' }}>
              
              {/* Left Details block */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 600 }}>{event.title}</h3>
                  
                  {/* Meta row 1 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--gdg-text-secondary)', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      {new Date(event.start_time).toLocaleString()} ({event.timezone || 'GMT+5:30'})
                    </span>
                    <span>|</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Monitor size={14} />
                      {event.type.toUpperCase()}
                    </span>
                    <span>|</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span className="gdg-dot" style={{ backgroundColor: getStatusColor(event.status) }} />
                      Status: <strong>{event.status}</strong>
                    </span>
                    <span>|</span>
                    <span>📋 RSVPs: {event.registration_count}/{event.capacity}</span>
                  </div>

                  {/* Meta row 2 */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--gdg-text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} />
                      Registrations: {event.registration_count}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckSquare size={14} />
                      Check-ins: {event.registration_count > 0 ? Math.floor(event.registration_count * 0.7) : 0}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate(`/dashboard/events/${event.id}/overview`)} className="blue-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <Link to={`/events/${event.id}`} className="blue-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <ExternalLink size={14} />
                    <span>Event page</span>
                  </Link>
                  <button className="blue-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <span>Duplicate</span>
                  </button>
                  <button 
                    className="blue-link" 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
                      alert('Event URL copied!');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                  >
                    <Copy size={14} />
                    <span>Copy URL</span>
                  </button>
                  
                  {event.status.toLowerCase() === 'draft' && (
                    <button 
                      onClick={() => handleDeleteEvent(event.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--gdg-error)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }}
                    >
                      <Trash size={14} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Thumbnail fixed ~180x180 */}
              <div style={{ 
                width: '180px', 
                height: '180px', 
                backgroundColor: '#1a1a2e', 
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#FFF',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                  <span className="logo-red" style={{ fontSize: '20px' }}>●</span>
                  <span className="logo-blue" style={{ fontSize: '20px' }}>●</span>
                  <span className="logo-yellow" style={{ fontSize: '20px' }}>●</span>
                  <span className="logo-green" style={{ fontSize: '20px' }}>●</span>
                </div>
                <span style={{ fontSize: '11px', color: '#8b8ba0', fontWeight: 'bold' }}>GDG Chapter Event</span>
                {/* Globe wireframe background simulation */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-30px', 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  border: '1px dashed rgba(255,255,255,0.1)' 
                }} />
              </div>

            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
