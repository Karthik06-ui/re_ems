import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChapter } from '../contexts/ChapterContext';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { apiRequest } = useAuth();
  const { chapters, selectChapter } = useChapter();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalEvents = async () => {
      const { status, data } = await apiRequest('/api/v1/events/?status=published', 'GET', null, false);
      if (status === 200) {
        setEvents(data);
      }
      setLoading(false);
    };
    fetchGlobalEvents();
  }, []);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Hero Search */}
      <section style={{ textAlign: 'center', padding: '40px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>Find Your Developer Community</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Search regional chapter meetups, technical workshops, and developer summits</p>
        <input 
          type="text" 
          placeholder="🔍 Search events by title or venue..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '600px', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px', outline: 'none' }}
        />
      </section>

      {/* Chapters grid */}
      <section style={{ marginBottom: '40px' }}>
        <h3>🏢 Regional Chapters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '16px' }}>
          {chapters.map(chapter => (
            <div key={chapter.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', height: '100%' }}>
              <div>
                <h4 style={{ margin: '0 0 8px' }}>{chapter.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', minHeight: '40px' }}>{chapter.description}</p>
                <p style={{ fontSize: '12px', fontWeight: '600', marginTop: '8px', color: 'var(--primary)' }}>📍 {chapter.location}</p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => {
                  selectChapter(chapter);
                  navigate(`/chapters/${chapter.slug}`);
                }}
              >
                Explore Chapter
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section>
        <h3>📅 Upcoming Featured Events</h3>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '16px' }}>Loading events...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '16px' }}>
            {filteredEvents.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No upcoming events found.</p>
            ) : null}
            {filteredEvents.map(event => (
              <div key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{event.type}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Capacity: {event.capacity}</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px' }}>{event.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{event.description.substring(0, 100)}...</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>📍 {event.venue}</p>
                </div>
                <Link to={`/events/${event.id}`} className="btn btn-primary" style={{ width: '100%', marginTop: '16px', textDecoration: 'none', boxSizing: 'border-box' }}>
                  View Event & RSVP
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
