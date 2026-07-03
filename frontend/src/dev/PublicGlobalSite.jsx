import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export default function PublicGlobalSite() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadEvents() {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBase}/api/v1/events/`);
        const data = await response.json();
        // Public API lists all events, filter only published ones for public view
        const published = data.filter(e => e.status === 'published' || e.status === 'registration open');
        setEvents(published);
      } catch (err) {
        console.error("Could not fetch public events. Backend might be down.", err);
      }
      setLoading(false);
    }
    loadEvents();
  }, []);

  return (
    <div style={{
      fontFamily: 'var(--gdg-font), system-ui, sans-serif',
      backgroundColor: '#F8F9FA',
      color: '#202124',
      minHeight: '100vh',
      paddingBottom: '60px'
    }}>
      {/* Simulation Header */}
      <header style={{
        backgroundColor: '#FFF',
        borderBottom: '1px solid #DADCE0',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 600, color: 'var(--gdg-blue)' }}>
            Kumaraguru Research Ecosystem
          </h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#5F6368', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Public Website Event Directory (Developer Sandbox Simulator)
          </p>
        </div>
        <span style={{
          backgroundColor: '#E8F0FE',
          color: '#1A73E8',
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '6px 12px',
          borderRadius: '4px'
        }}>
          DEV MODE ONLY
        </span>
      </header>

      {/* Hero Banner */}
      <div style={{
        maxWidth: '1100px',
        margin: '32px auto 0 auto',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
          borderRadius: '16px',
          padding: '40px',
          color: '#FFF',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 12px 0', fontWeight: 500 }}>Find Upcoming Workshops & Hackathons</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '15px', maxWidth: '600px', lineHeight: 1.5 }}>
            Browse and sign up for research initiatives hosted by the Kumaraguru Google Developer Group Chapter.
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <main style={{
        maxWidth: '1100px',
        margin: '32px auto 0 auto',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px' }}>
            <div className="gdg-spinner" style={{ width: '40px', height: '40px' }}></div>
            <p style={{ marginTop: '16px', color: '#5F6368', fontSize: '14px' }}>Loading public event list...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{
            backgroundColor: '#FFF',
            border: '1px solid #DADCE0',
            borderRadius: '12px',
            padding: '80px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ margin: 0, color: '#5F6368', fontSize: '15px', fontStyle: 'italic' }}>
              No published events found. Try creating and publishing an event inside the Admin Dashboard first!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '28px'
          }}>
            {events.map((ev) => (
              <div key={ev.id} style={{
                backgroundColor: '#FFF',
                border: '1px solid #DADCE0',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              }}
              >
                {/* Event Image Banner */}
                <div style={{
                  height: '150px',
                  background: ev.cover_image ? `url(${ev.cover_image}) center/cover no-repeat` : 'linear-gradient(135deg, #1A73E8 0%, #7C4DFF 100%)',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#202124',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {ev.category || 'workshop'}
                  </span>
                </div>

                {/* Event Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 500, lineHeight: 1.4 }}>
                    {ev.title}
                  </h3>
                  <p style={{
                    margin: '0 0 20px 0',
                    fontSize: '13px',
                    color: '#5F6368',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {ev.description || 'Join us for this hands-on workshop to learn modern best practices, collaborate, and expand your technical skill sets.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#5F6368' }}>
                      <Calendar size={14} style={{ color: '#1A73E8', flexShrink: 0 }} />
                      <span>{new Date(ev.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#5F6368' }}>
                      <MapPin size={14} style={{ color: '#1A73E8', flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                        {ev.venue || 'Virtual / Online'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/portal/login?event=${ev.id}`)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: '#1A73E8',
                      color: '#FFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1557B0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1A73E8'}
                  >
                    <span>Register Now</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
