import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ParticipantDashboard() {
  const { apiRequest } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchDashboardData = async () => {
    setLoading(true);
    const res = await apiRequest('/api/v1/portal/dashboard/', 'GET', null, true);
    if (res.status === 200) {
      setData(res.data);
    }
    setLoading(false);
  };

  const handleRespondInvitation = async (invitationId, responseAction) => {
    setLoading(true);
    const res = await apiRequest(`/api/v1/events/invitations/${invitationId}/respond/`, 'POST', {
      response: responseAction
    }, true);
    if (res.status === 200) {
      alert(`Invitation ${responseAction === 'accept' ? 'accepted' : 'declined'} successfully.`);
      fetchDashboardData();
    } else {
      alert(res.data?.detail || "Failed to respond to invitation.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <PortalLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div className="gdg-spinner"></div>
        </div>
      </PortalLayout>
    );
  }

  const eventsList = data?.events[activeTab] || [];
  const totalParticipated = data?.analytics?.total_events_participated || 0;

  return (
    <PortalLayout>
      {/* Metrics Section */}
      <div className="gdg-stat-grid" style={{ marginBottom: '32px' }}>
        <div className="gdg-stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
          <div style={{
            fontSize: '32px',
            backgroundColor: 'rgba(66, 133, 244, 0.08)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gdg-blue)'
          }}>
            🎓
          </div>
          <div>
            <div className="stat-label" style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)', marginBottom: '4px' }}>
              Total Participations
            </div>
            <div className="stat-value" style={{ fontSize: '28px', fontWeight: 600, color: 'var(--gdg-text-primary)' }}>
              {totalParticipated} {totalParticipated === 1 ? 'Event' : 'Events'}
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Center */}
      {data?.invitations && data.invitations.length > 0 && (
        <div className="gdg-card" style={{
          backgroundColor: '#FFF',
          border: '1px solid #FBBC05',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#B06000', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔔 Pending Team Invitations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.invitations.map(invite => (
              <div key={invite.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#FFFDF6',
                border: '1px solid rgba(251, 188, 5, 0.25)',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    Invitation to join <strong>{invite.team_name}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gdg-text-secondary)', marginTop: '2px' }}>
                    Invited by {invite.invited_by.name} ({invite.invited_by.email})
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleRespondInvitation(invite.id, 'accept')}
                    style={{
                      backgroundColor: 'var(--gdg-blue)',
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondInvitation(invite.id, 'decline')}
                    style={{
                      backgroundColor: '#FFF',
                      border: '1px solid var(--gdg-border)',
                      color: 'var(--gdg-text-secondary)',
                      padding: '6px 16px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Switcher Section */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--gdg-border)',
        marginBottom: '28px',
        gap: '24px'
      }}>
        {['upcoming', 'registered', 'completed'].map((tab) => {
          const isActive = activeTab === tab;
          const count = data?.events[tab]?.length || 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--gdg-blue)' : '3px solid transparent',
                color: isActive ? 'var(--gdg-blue)' : 'var(--gdg-text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                padding: '12px 4px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Event Cards Grid */}
      {eventsList.length === 0 ? (
        <div style={{
          padding: '60px 24px',
          border: '1px dashed var(--gdg-border)',
          borderRadius: '12px',
          textAlign: 'center',
          backgroundColor: '#FFF'
        }}>
          <p style={{ margin: 0, color: 'var(--gdg-text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
            No events found in this category.
          </p>
        </div>
      ) : (
        <div className="gdg-event-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {eventsList.map((ev) => (
            <div key={ev.id} className="gdg-card hover-lift" style={{
              backgroundColor: '#FFF',
              border: '1px solid var(--gdg-border)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease-in-out'
            }}>
              {/* Card Header Image */}
              <div style={{
                height: '140px',
                background: ev.cover_image ? `url(${ev.cover_image}) center/cover no-repeat` : 'linear-gradient(135deg, var(--gdg-blue) 0%, #7C4DFF 100%)',
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
                  {ev.type}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 500, lineHeight: 1.4 }}>
                  {ev.title}
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--gdg-text-secondary)' }}>
                    <Calendar size={14} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                    <span>{new Date(ev.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--gdg-text-secondary)' }}>
                    <MapPin size={14} style={{ color: 'var(--gdg-blue)', flexShrink: 0 }} />
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '220px'
                    }}>
                      {ev.venue || 'Virtual / Online'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action footer */}
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--gdg-border)',
                backgroundColor: '#FAFAFA',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <Link 
                  to={`/portal/events/${ev.id}`} 
                  className="blue-link" 
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>View Details</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
