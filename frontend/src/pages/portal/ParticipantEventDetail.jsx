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
  const [teamData, setTeamData] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isTeamLoading, setIsTeamLoading] = useState(false);

  const fetchEventDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    const res = await apiRequest(`/api/v1/events/${id}/`, 'GET', null, true);
    if (res.status === 200) {
      setEvent(res.data);
      if (res.data.registration_mode === 'team' && res.data.user_status?.type === 'team') {
        fetchTeamData(res.data.user_status.team_id);
      } else {
        setTeamData(null);
      }
    } else {
      setErrorMsg(res.data?.detail || 'The event details could not be retrieved.');
    }
    setLoading(false);
  };

  const fetchTeamData = async (teamId) => {
    setIsTeamLoading(true);
    const res = await apiRequest(`/api/v1/events/teams/${teamId}/`, 'GET', null, true);
    if (res.status === 200) {
      setTeamData(res.data);
    }
    setIsTeamLoading(false);
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setActionLoading(true);
    const res = await apiRequest('/api/v1/events/teams/', 'POST', {
      event: event.id,
      name: newTeamName,
      description: newTeamDesc
    }, true);
    if (res.status === 201) {
      alert("Team created successfully!");
      setNewTeamName('');
      setNewTeamDesc('');
      fetchEventDetails();
    } else {
      alert(res.data?.detail || "Failed to create team.");
    }
    setActionLoading(false);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/teams/${teamData.id}/invite/`, 'POST', {
      email: inviteEmail
    }, true);
    if (res.status === 201) {
      alert("Invitation sent successfully!");
      setInviteEmail('');
      fetchTeamData(teamData.id);
    } else {
      alert(res.data?.detail || "Failed to send invitation.");
    }
    setActionLoading(false);
  };

  const handleCancelInvite = async (email) => {
    if (!window.confirm(`Are you sure you want to cancel the invitation to ${email}?`)) return;
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/teams/${teamData.id}/cancel-invite/`, 'POST', {
      email
    }, true);
    if (res.status === 200) {
      alert("Invitation cancelled.");
      fetchTeamData(teamData.id);
    } else {
      alert(res.data?.detail || "Failed to cancel invitation.");
    }
    setActionLoading(false);
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from the team?`)) return;
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/teams/${teamData.id}/remove-member/`, 'POST', {
      user_id: userId
    }, true);
    if (res.status === 200) {
      alert("Member removed.");
      fetchEventDetails();
    } else {
      alert(res.data?.detail || "Failed to remove member.");
    }
    setActionLoading(false);
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm("Are you sure you want to leave the team?")) return;
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/teams/${teamData.id}/leave/`, 'POST', {}, true);
    if (res.status === 200) {
      alert("You have left the team.");
      fetchEventDetails();
    } else {
      alert(res.data?.detail || "Failed to leave team.");
    }
    setActionLoading(false);
  };

  const handleRegisterTeam = async () => {
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/teams/${teamData.id}/register_team/`, 'POST', {}, true);
    if (res.status === 200 || res.status === 202) {
      alert(res.data.detail || "Team registered successfully!");
      fetchEventDetails();
    } else {
      alert(res.data?.detail || "Failed to register team.");
    }
    setActionLoading(false);
  };

  const handleCancelTeam = async () => {
    if (!window.confirm("Are you sure you want to delete the team and cancel registration?")) return;
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/teams/${teamData.id}/cancel_team/`, 'POST', {}, true);
    if (res.status === 200) {
      alert("Team deleted successfully.");
      fetchEventDetails();
    } else {
      alert(res.data?.detail || "Failed to delete team.");
    }
    setActionLoading(false);
  };

  const handleRespondInvitation = async (invitationId, responseAction) => {
    setActionLoading(true);
    const res = await apiRequest(`/api/v1/events/invitations/${invitationId}/respond/`, 'POST', {
      response: responseAction
    }, true);
    if (res.status === 200) {
      alert(`Invitation ${responseAction === 'accept' ? 'accepted' : 'declined'}.`);
      fetchEventDetails();
    } else {
      alert(res.data?.detail || "Failed to respond to invitation.");
    }
    setActionLoading(false);
  };

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
            {event.registration_mode === 'team' && teamData && (
              <div className="gdg-card" style={{
                backgroundColor: '#FFF',
                border: '1px solid var(--gdg-border)',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Team: {teamData.name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>
                      {teamData.description || 'No description provided.'}
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: 'rgba(66, 133, 244, 0.08)',
                    color: 'var(--gdg-blue)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    textTransform: 'uppercase'
                  }}>
                    {teamData.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--gdg-border)', margin: '0 0 20px 0' }} />

                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Members ({teamData.members.length} / {event.max_team_size})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {teamData.members.map(m => (
                    <div key={m.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: '#F8F9FA',
                      borderRadius: '6px',
                      border: '1px solid var(--gdg-border)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{m.user.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>{m.user.email} • {m.user.department || 'N/A'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: m.role === 'leader' ? 'rgba(251, 188, 5, 0.08)' : 'rgba(52, 168, 83, 0.08)',
                          color: m.role === 'leader' ? '#B06000' : '#137333',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          textTransform: 'capitalize'
                        }}>{m.role}</span>
                        {teamData.leader.id === user.id && m.user.id !== user.id && (
                          <button
                            onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                            disabled={actionLoading}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'var(--gdg-error)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {teamData.leader.id === user.id && (
                  <>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Invitations</h4>
                    {teamData.invitations.filter(i => i.status === 'pending').length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                        {teamData.invitations.filter(i => i.status === 'pending').map(invite => (
                          <div key={invite.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            backgroundColor: '#FFF',
                            borderRadius: '6px',
                            border: '1px solid var(--gdg-border)'
                          }}>
                            <span style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>{invite.email}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--gdg-text-secondary)' }}>Pending</span>
                              <button
                                onClick={() => handleCancelInvite(invite.email)}
                                disabled={actionLoading}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: 'var(--gdg-text-secondary)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--gdg-text-secondary)', margin: '0 0 24px 0' }}>
                        No pending invitations.
                      </p>
                    )}

                    {teamData.members.length + teamData.invitations.filter(i => i.status === 'pending').length < event.max_team_size ? (
                      <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: '12px' }}>
                        <input
                          type="email"
                          placeholder="Colleague's email address..."
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          required
                          style={{
                            flexGrow: 1,
                            padding: '8px 12px',
                            border: '1px solid var(--gdg-border)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="btn btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          Send Invite
                        </button>
                      </form>
                    ) : (
                      <p style={{ fontSize: '12px', color: 'var(--gdg-text-secondary)', margin: 0 }}>
                        Maximum capacity reached (members + pending invites).
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
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

              {/* Status Display & Actions */}
              {event.registration_mode === 'team' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {event.user_status?.type === 'team' ? (
                    <>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        backgroundColor: 'rgba(66, 133, 244, 0.08)',
                        border: '1px solid rgba(66, 133, 244, 0.2)',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>Team: {event.user_status.team_name}</div>
                        <div style={{ textTransform: 'capitalize', color: 'var(--gdg-blue)', fontWeight: 600 }}>
                          Status: {event.user_status.status.replace(/_/g, ' ')}
                        </div>
                      </div>

                      {event.user_status.role === 'leader' ? (
                        <>
                          {(event.user_status.status === 'pending' || event.user_status.status === 'suspended_incomplete') ? (
                            <button
                              onClick={handleRegisterTeam}
                              disabled={actionLoading || (teamData?.members?.length < event.min_team_size)}
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
                              {actionLoading ? 'Processing...' : 'Submit Team Registration'}
                            </button>
                          ) : (
                            <button
                              onClick={handleCancelTeam}
                              disabled={actionLoading}
                              className="btn btn-danger"
                              style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px' }}
                            >
                              {actionLoading ? 'Processing...' : 'Cancel Team Registration'}
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={handleLeaveTeam}
                          disabled={actionLoading}
                          className="btn btn-danger"
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px' }}
                        >
                          {actionLoading ? 'Processing...' : 'Leave Team'}
                        </button>
                      )}
                    </>
                  ) : event.user_status?.type === 'invited' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="alert alert-warning" style={{ fontSize: '12px', margin: 0, padding: '10px', backgroundColor: 'rgba(251, 188, 5, 0.08)', border: '1px solid rgba(251, 188, 5, 0.25)', color: '#B06000', borderRadius: '6px' }}>
                        You're invited to join team <strong>{event.user_status.team_name}</strong>.
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRespondInvitation(event.user_status.invitation_id, 'accept')}
                          disabled={actionLoading}
                          className="btn btn-primary"
                          style={{ flexGrow: 1, padding: '8px', fontSize: '12px', backgroundColor: 'var(--gdg-blue)', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondInvitation(event.user_status.invitation_id, 'decline')}
                          disabled={actionLoading}
                          className="btn btn-secondary"
                          style={{ flexGrow: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--gdg-text-secondary)' }}>
                        This is a team event. Create a team to get started and invite your members.
                      </p>
                      <input
                        type="text"
                        placeholder="Team Name"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        required
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--gdg-border)', fontSize: '13px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="Team Description (Optional)"
                        value={newTeamDesc}
                        onChange={e => setNewTeamDesc(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--gdg-border)', fontSize: '13px', outline: 'none' }}
                      />
                      <button
                        type="submit"
                        disabled={actionLoading || !newTeamName.trim()}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--gdg-blue)', border: 'none', color: '#FFF', cursor: 'pointer' }}
                      >
                        Create Team
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <>
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
                      fontWeight: 500,
                      marginBottom: '10px'
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
                      fontWeight: 500,
                      marginBottom: '10px'
                    }}>
                      <AlertCircle size={16} />
                      <span>On Waitlist (Pos {event.user_status.position})</span>
                    </div>
                  )}

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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
