import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  EventCard, 
  DashboardCard, 
  FilterPill 
} from '../../components/DashboardComponents';
import { Plus, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function EventList() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showTest, setShowTest] = useState(false);
  const [showHidden, setShowHidden] = useState(true);

  // Quick creator states
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('DevOps Deployment CodeLab');
  const [newVenue, setNewVenue] = useState('Google Seattle');
  const [newCapacity, setNewCapacity] = useState('150');

  const fetchEventsData = async () => {
    if (!activeChapter) return;
    setLoading(true);
    const { status, data } = await apiRequest(`/api/v1/events/?chapter=${activeChapter.slug}`, 'GET', null, true);
    if (status === 200) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEventsData();
  }, [activeChapter]);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!activeChapter) return;

    const start_time = new Date();
    start_time.setDate(start_time.getDate() + 7);
    const end_time = new Date(start_time.getTime() + 3 * 60 * 60 * 1000);

    const { status } = await apiRequest('/api/v1/events/', 'POST', {
      chapter: activeChapter.id,
      title: newTitle,
      description: 'Hands-on DevOps pipeline integrations, CI/CD models review, and containerized deployment scheduling.',
      type: 'physical',
      capacity: parseInt(newCapacity),
      venue: newVenue,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      timezone: 'GMT+5:30',
      status: 'draft' // Seeding starts at draft state
    }, true);

    if (status === 201) {
      setCreating(false);
      fetchEventsData();
    }
  };

  // State machine transition validator
  const handleTransitionState = async (eventId, newStatus) => {
    // Get target event to check transition rules
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    const current = targetEvent.status.toLowerCase();
    const next = newStatus.toLowerCase();

    // Verification check validations
    if (current === 'completed' && next === 'draft') {
      alert("Invalid transition: A Completed event cannot revert to Draft status.");
      return;
    }
    if (current === 'archived' && next !== 'archived') {
      alert("Invalid transition: An Archived event is locked and cannot transition out.");
      return;
    }

    const { status } = await apiRequest(`/api/v1/events/${eventId}/`, 'PATCH', {
      status: next
    }, true);

    if (status === 200) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: next } : e));
    } else {
      alert("Failed to patch event lifecycle transition.");
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!window.confirm("Delete this event configuration?")) return;
    const { status } = await apiRequest(`/api/v1/events/${id}/`, 'DELETE', null, true);
    if (status === 200 || status === 204) {
      fetchEventsData();
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesQuery = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || e.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesQuery && matchesStatus;
  });

  return (
    <DashboardShell sectionTitle="Events">
      
      {/* Upper toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search events by title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '6px 12px 6px 30px', borderRadius: '4px', border: '1px solid var(--gdg-border)', fontSize: '13px', width: '220px' }}
          />
        </div>

        <button 
          onClick={() => setCreating(prev => !prev)} 
          className="btn"
          style={{ backgroundColor: '#202124', color: '#FFF', borderRadius: '24px', padding: '10px 20px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>New event</span>
        </button>
      </div>

      {/* Draft Creator drawer */}
      {creating && (
        <DashboardCard title="Draft New Chapter Event">
          <form onSubmit={handleCreateDraft} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Event Name</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Venue Location</label>
                <input type="text" value={newVenue} onChange={e => setNewVenue(e.target.value)} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Total Seating Seating Capacity</label>
                <input type="number" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} required />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Create Event Draft</button>
              </div>
            </div>
          </form>
        </DashboardCard>
      )}

      {/* Status filter bar */}
      <div className="gdg-filters-bar" style={{ marginTop: '16px' }}>
        <div className="gdg-filter-group">
          {['All', 'Draft', 'Published', 'Registration Open', 'Registration Closed', 'Completed', 'Archived'].map(st => (
            <FilterPill 
              key={st}
              label={st} 
              active={statusFilter === st} 
              onClick={() => setStatusFilter(st)} 
            />
          ))}
        </div>
      </div>

      {/* CARD LIST */}
      {loading ? (
        <div className="gdg-spinner-container">
          <div className="gdg-spinner"></div>
          <span>Loading chapter events directory...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--gdg-text-secondary)', fontStyle: 'italic' }}>No events found matches the filters.</p>
            </div>
          ) : null}

          {filteredEvents.map(event => (
            <EventCard 
              key={event.id}
              event={event}
              onEdit={(id) => navigate(`/dashboard/events/${id}/overview`)}
              onView={(id) => navigate(`/dashboard/events/${id}/overview`)}
              onDuplicate={() => alert('Event duplicated successfully!')}
              onDelete={handleDeleteDraft}
              onTransition={handleTransitionState}
            />
          ))}
        </div>
      )}

    </DashboardShell>
  );
}
