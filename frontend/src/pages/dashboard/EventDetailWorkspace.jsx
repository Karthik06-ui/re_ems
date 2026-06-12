import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  ChevronLeft, RefreshCw, MoreVertical, Edit, UserCheck, Plus, Trash2, 
  ArrowUp, ArrowDown, Download, CheckSquare, MessageSquare, Send, Award, BookOpen,
  ExternalLink, Copy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  RegistrationTable, 
  WaitlistTable, 
  StatCard, 
  DashboardCard, 
  EventStatusBadge
} from '../../components/DashboardComponents';

// Mock Registration Trend Data
const registrationTrends = [
  { name: 'Day 1', count: 10 },
  { name: 'Day 2', count: 32 },
  { name: 'Day 3', count: 78 },
  { name: 'Day 4', count: 145 },
  { name: 'Day 5', count: 182 }
];

const registrationSourceData = [
  { name: 'Email Campaign', count: 95 },
  { name: 'Sponsor Referrals', count: 42 },
  { name: 'Slack/Discord', count: 30 },
  { name: 'Organic', count: 15 }
];

export default function EventDetailWorkspace() {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { apiRequest } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Registration list
  const [registrations, setRegistrations] = useState([
    { email: 'karthik@gdgdemo.org', ticket_type: 'General Admission', date: '2026-Jun-09', status: 'confirmed' },
    { email: 'guest.user@college.edu', ticket_type: 'General Admission', date: '2026-Jun-09', status: 'checked_in' },
    { email: 'developer.lead@kumaraguru.edu', ticket_type: 'VIP Pass', date: '2026-Jun-10', status: 'confirmed' }
  ]);

  // Waitlist list
  const [waitlist, setWaitlist] = useState([
    { position: 1, email: 'waitlist.one@college.edu', date: '2026-Jun-10' },
    { position: 2, email: 'waitlist.two@college.edu', date: '2026-Jun-10' }
  ]);

  // Agenda Sessions list
  const [sessions, setSessions] = useState([
    { id: 1, title: 'Keynote: Era of Infinite Software', duration: '40m', track: 'Keynote', speaker: 'Dr. Jane Smith' },
    { id: 2, title: 'Optimizing Vite & Rollup Bundling', duration: '30m', track: 'Frontend', speaker: 'Deepika Kumar' }
  ]);

  // Session form inputs
  const [sesTitle, setSesTitle] = useState('');
  const [sesDuration, setSesDuration] = useState('30m');
  const [sesTrack, setSesTrack] = useState('Frontend');
  const [sesSpeaker, setSesSpeaker] = useState('Dr. Jane Smith');

  // Speakers list
  const [speakers, setSpeakers] = useState([
    { id: 1, name: 'Dr. Jane Smith', bio: 'Principal Web Architect & Google Developer Expert', avatar: 'https://i.pravatar.cc/100?img=1' },
    { id: 2, name: 'Deepika Kumar', bio: 'Staff Engineer & Chapter Lead at GDG Coimbatore', avatar: 'https://i.pravatar.cc/100?img=2' }
  ]);
  const [spName, setSpName] = useState('');
  const [spBio, setSpBio] = useState('');

  // Survey Questions list
  const [surveyQuestions, setSurveyQuestions] = useState([
    { id: 1, text: 'What is your primary programming language?', type: 'Multiple Choice' },
    { id: 2, text: 'What do you hope to learn in this workshop?', type: 'Free Text' }
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('Multiple Choice');

  // Details Tab Form states
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [statusVal, setStatusVal] = useState('draft');
  const [saving, setSaving] = useState(false);

  // Communications announcements list
  const [announcements, setAnnouncements] = useState([
    { id: 1, subject: 'Event Seating Directions', date: '2026-Jun-10', recipients: 'All Confirmed Attendees' }
  ]);
  const [annSubject, setAnnSubject] = useState('');
  const [annBody, setAnnBody] = useState('');

  // Event sponsors states
  const [eventSponsors, setEventSponsors] = useState([]);
  const [allSponsors, setAllSponsors] = useState([]);
  const [selectedSponsorId, setSelectedSponsorId] = useState('');
  const [sponsorTierOverride, setSponsorTierOverride] = useState('gold');
  const [addingSponsor, setAddingSponsor] = useState(false);

  const fetchWorkspaceDetails = async () => {
    setLoading(true);
    const { status, data } = await apiRequest(`/api/v1/events/${id}/`, 'GET', null, false);
    if (status === 200) {
      setEvent(data);
      setTitle(data.title);
      setVenue(data.venue);
      setCapacity(data.capacity);
      setStatusVal(data.status);
    }
    setLoading(false);
  };

  const fetchSponsorsData = async () => {
    const placementRes = await apiRequest(`/api/v1/sponsors/event-placements/?event=${id}`, 'GET', null, true);
    if (placementRes.status === 200) {
      setEventSponsors(placementRes.data);
    }
    const allSponsorsRes = await apiRequest('/api/v1/sponsors/', 'GET', null, true);
    if (allSponsorsRes.status === 200 && event) {
      setAllSponsors(allSponsorsRes.data);
    }
  };

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [id]);

  useEffect(() => {
    if (tab === 'sponsors') {
      fetchSponsorsData();
    }
  }, [tab, id, event]);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { status } = await apiRequest(`/api/v1/events/${id}/`, 'PATCH', {
      title,
      venue,
      capacity: parseInt(capacity),
      status: statusVal
    }, true);

    if (status === 200) {
      alert('Event parameters saved successfully!');
      fetchWorkspaceDetails();
    } else {
      alert('Failed to update event settings.');
    }
    setSaving(false);
  };

  // Duplicate Event
  const handleDuplicateEvent = async (eventToDuplicate) => {
    if (!eventToDuplicate) return;
    const copyTitle = `${eventToDuplicate.title} (Copy)`;
    const { status, data } = await apiRequest('/api/v1/events/', 'POST', {
      title: copyTitle,
      description: eventToDuplicate.description || 'Hands-on DevOps pipeline integrations, CI/CD models review, and containerized deployment scheduling.',
      type: eventToDuplicate.type || 'physical',
      capacity: eventToDuplicate.capacity,
      venue: eventToDuplicate.venue,
      start_time: eventToDuplicate.start_time,
      end_time: eventToDuplicate.end_time,
      timezone: eventToDuplicate.timezone || 'GMT+5:30',
      status: 'draft'
    }, true);

    if (status === 201) {
      alert("Event duplicated successfully as draft!");
      if (data && data.id) {
        navigate(`/dashboard/events/${data.id}/overview`);
      } else {
        navigate('/dashboard/events');
      }
    } else {
      alert("Failed to duplicate event: " + (data?.detail || JSON.stringify(data)));
    }
  };

  // Checkin Attendee
  const handleCheckin = async (emailToSubmit) => {
    const { status } = await apiRequest(`/api/v1/events/${id}/checkin/`, 'POST', {
      email: emailToSubmit
    }, true);

    if (status === 200) {
      setRegistrations(prev => prev.map(r => r.email === emailToSubmit ? { ...r, status: 'checked_in' } : r));
      alert(`Registrant successfully checked in: ${emailToSubmit}`);
    } else {
      alert('Check-in failed. Please verify user status.');
    }
  };

  // Promote registrant from waitlist
  const handlePromoteAttendee = async (emailToPromote) => {
    // Call registration endpoint (will promote FIFO)
    const { status } = await apiRequest(`/api/v1/events/${id}/register/`, 'POST', {}, true);
    if (status === 201 || status === 202) {
      // Simulate frontend shift
      setWaitlist(prev => prev.filter(w => w.email !== emailToPromote).map((w, idx) => ({ ...w, position: idx + 1 })));
      setRegistrations(prev => [...prev, { email: emailToPromote, ticket_type: 'General Admission', date: '2026-Jun-10', status: 'confirmed' }]);
      alert(`Seat promoted to Confirmed: ${emailToPromote}`);
    } else {
      alert('Promotion failed.');
    }
  };

  const handleAssignSponsor = async (e) => {
    e.preventDefault();
    if (!selectedSponsorId) return;

    const { status } = await apiRequest('/api/v1/sponsors/event-placements/', 'POST', {
      event: parseInt(id),
      sponsor: parseInt(selectedSponsorId),
      tier_override: sponsorTierOverride
    }, true);

    if (status === 201) {
      setAddingSponsor(false);
      setSelectedSponsorId('');
      fetchSponsorsData();
    } else {
      alert("Failed to assign sponsor to event.");
    }
  };

  const handleRemoveSponsorPlacement = async (placementId) => {
    if (!window.confirm("Remove this sponsor from the event?")) return;
    const { status } = await apiRequest(`/api/v1/sponsors/event-placements/${placementId}/`, 'DELETE', null, true);
    if (status === 200 || status === 204) {
      fetchSponsorsData();
    } else {
      alert("Failed to remove sponsor placement.");
    }
  };

  // Agenda Session Actions
  const handleAddSession = (e) => {
    e.preventDefault();
    if (!sesTitle) return;
    const newSes = {
      id: Date.now(),
      title: sesTitle,
      duration: sesDuration,
      track: sesTrack,
      speaker: sesSpeaker
    };
    setSessions(prev => [...prev, newSes]);
    setSesTitle('');
  };

  const handleMoveSession = (idx, direction) => {
    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= sessions.length) return;
    const reordered = [...sessions];
    const temp = reordered[idx];
    reordered[idx] = reordered[nextIdx];
    reordered[nextIdx] = temp;
    setSessions(reordered);
  };

  // Speaker Add
  const handleAddSpeaker = (e) => {
    e.preventDefault();
    if (!spName) return;
    const newSp = {
      id: Date.now(),
      name: spName,
      bio: spBio,
      avatar: 'https://i.pravatar.cc/100?img=' + (speakers.length + 3)
    };
    setSpeakers(prev => [...prev, newSp]);
    setSpName('');
    setSpBio('');
  };

  // Survey Add Question
  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText) return;
    const newQ = {
      id: Date.now(),
      text: newQuestionText,
      type: newQuestionType
    };
    setSurveyQuestions(prev => [...prev, newQ]);
    setNewQuestionText('');
  };

  // CSV Export Mock
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["EMAIL,TICKET TYPE,STATUS"].join(",") + "\n"
      + registrations.map(r => `${r.email},${r.ticket_type},${r.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registrations_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !event) {
    return (
      <DashboardShell sectionTitle="Events">
        <div className="gdg-spinner-container">
          <div className="gdg-spinner"></div>
          <span>Syncing workspace timelines...</span>
        </div>
      </DashboardShell>
    );
  }

  const workspaceTabs = [
    'overview', 'details', 'agenda', 'speakers', 'registrations', 
    'waitlist', 'surveys', 'sponsors', 'communications', 'analytics', 'wrapup'
  ];

  return (
    <DashboardShell sectionTitle="Events">
      
      {/* 1. TITLE BREADCRUMBS HEADER */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/dashboard/events" className="blue-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', marginBottom: '8px' }}>
          <ChevronLeft size={16} />
          <span>Events</span>
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 500, margin: '0 0 6px 0' }}>{event.title}</h2>
            <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '14px', margin: 0 }}>📍 {event.venue} | ⏰ {new Date(event.start_time).toLocaleString()}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <EventStatusBadge status={event.status} />
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderLeft: '1px solid var(--gdg-border)', paddingLeft: '16px' }}>
              <button 
                onClick={() => navigate(`/dashboard/events/${id}/overview`)} 
                className="blue-link" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0 }}
              >
                <Edit size={14} />
                <span>Workspace</span>
              </button>

              <a 
                href={`/events/${id}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="blue-link" 
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
              >
                <ExternalLink size={14} />
                <span>Event Page</span>
              </a>

              <button 
                onClick={() => handleDuplicateEvent(event)} 
                className="blue-link" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0 }}
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>

              <button 
                className="blue-link" 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
                  alert('URL copied!');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0 }}
              >
                <Copy size={14} />
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB NAVIGATION TABS */}
      <div className="gdg-tabs-container">
        {workspaceTabs.map(t => (
          <button 
            key={t}
            className={`gdg-tab ${tab === t ? 'active' : ''}`}
            onClick={() => navigate(`/dashboard/events/${id}/${t}`)}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'wrapup' ? 'Wrap Up' : t}
          </button>
        ))}
      </div>

      {/* 3. TABS CONTENT */}
      <div style={{ marginTop: '16px' }}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="gdg-grid-2-1">
            <DashboardCard title="Event Summary Description">
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--gdg-text-secondary)', margin: '0 0 20px 0' }}>{event.description}</p>
              
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--gdg-text-secondary)', textTransform: 'uppercase' }}>Assigned Speakers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {speakers.map(sp => (
                  <div key={sp.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img src={sp.avatar} alt={sp.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 500, display: 'block' }}>{sp.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>{sp.bio}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <StatCard value={event.registration_count || 182} label="Confirmed Seats" emoji="🎫" />
              <StatCard value={event.capacity} label="Total Seating Limit" emoji="📋" />
            </div>
          </div>
        )}

        {/* DETAILS TAB */}
        {tab === 'details' && (
          <DashboardCard title="Configure Event Details" className="max-w-xl">
            <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Title Name</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Venue Location</label>
                  <input type="text" value={venue} onChange={e => setVenue(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Seating Capacity</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Lifecycle Status (State Machine)</label>
                <select value={statusVal} onChange={e => setStatusVal(e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="registration open">Registration Open</option>
                  <option value="registration closed">Registration Closed</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }} disabled={saving}>
                {saving ? 'Updating settings...' : 'Update Details'}
              </button>
            </form>
          </DashboardCard>
        )}

        {/* AGENDA TAB */}
        {tab === 'agenda' && (
          <div className="gdg-grid-2-1">
            {/* Session Builder */}
            <DashboardCard title="Event Agenda Timeline slots">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessions.map((ses, idx) => (
                  <div key={ses.id} style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{ses.title}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>
                        Duration: {ses.duration} | Track: {ses.track} | Speaker: {ses.speaker}
                      </p>
                    </div>
                    {/* Ordering controls */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="gdg-share-icon-btn" style={{ width: '24px', height: '24px' }} onClick={() => handleMoveSession(idx, 'up')} disabled={idx === 0}><ArrowUp size={12} /></button>
                      <button className="gdg-share-icon-btn" style={{ width: '24px', height: '24px' }} onClick={() => handleMoveSession(idx, 'down')} disabled={idx === sessions.length - 1}><ArrowDown size={12} /></button>
                      <button className="gdg-share-icon-btn" style={{ width: '24px', height: '24px', color: 'var(--gdg-error)' }} onClick={() => setSessions(prev => prev.filter(s => s.id !== ses.id))}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>

            {/* Add Session */}
            <DashboardCard title="Add Session Slot">
              <form onSubmit={handleAddSession} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Session Title</label>
                  <input type="text" value={sesTitle} onChange={e => setSesTitle(e.target.value)} required placeholder="e.g. Q&A Session" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Duration</label>
                    <input type="text" value={sesDuration} onChange={e => setSesDuration(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Track assignment</label>
                    <input type="text" value={sesTrack} onChange={e => setSesTrack(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Assign Speaker</label>
                  <select value={sesSpeaker} onChange={e => setSesSpeaker(e.target.value)}>
                    {speakers.map(sp => (
                      <option key={sp.id} value={sp.name}>{sp.name}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary" type="submit">Add to Agenda</button>
              </form>
            </DashboardCard>
          </div>
        )}

        {/* SPEAKERS TAB */}
        {tab === 'speakers' && (
          <div className="gdg-grid-2-1">
            <DashboardCard title="Speakers Directory">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {speakers.map(sp => (
                  <div key={sp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gdg-border)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <img src={sp.avatar} alt={sp.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{sp.name}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>{sp.bio}</span>
                      </div>
                    </div>
                    <button className="gdg-share-icon-btn" style={{ color: 'var(--gdg-error)' }} onClick={() => setSpeakers(prev => prev.filter(s => s.id !== sp.id))}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Invite Speaker">
              <form onSubmit={handleAddSpeaker} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Speaker Name</label>
                  <input type="text" value={spName} onChange={e => setSpName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Biography Summary</label>
                  <textarea value={spBio} onChange={e => setSpBio(e.target.value)} rows={3} required />
                </div>
                <button className="btn btn-primary" type="submit">Add Speaker</button>
              </form>
            </DashboardCard>
          </div>
        )}

        {/* REGISTRATIONS TAB */}
        {tab === 'registrations' && (
          <DashboardCard title="Event Registrant Table">
            <RegistrationTable 
              registrations={registrations} 
              onCheckin={handleCheckin}
              onBulkCheckin={() => {
                setRegistrations(prev => prev.map(r => ({ ...r, status: 'checked_in' })));
                alert('All attendees successfully checked in!');
              }}
              onExport={handleExportCSV}
            />
          </DashboardCard>
        )}

        {/* WAITLIST TAB */}
        {tab === 'waitlist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="gdg-stat-grid">
              <StatCard value={waitlist.length} label="Total Waitlisted" emoji="⏳" />
              <StatCard value={waitlist.length > 0 ? "High Volume" : "Empty Queue"} label="Waitlist Status" emoji="📈" />
            </div>

            <DashboardCard title="Waitlist Queue Placement (FIFO)">
              <WaitlistTable 
                waitlist={waitlist}
                onPromote={handlePromoteAttendee}
              />
            </DashboardCard>
          </div>
        )}

        {/* SURVEYS TAB */}
        {tab === 'surveys' && (
          <div className="gdg-grid-2-1">
            <DashboardCard title="Survey Questions Deck">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {surveyQuestions.map(q => (
                  <div key={q.id} style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', padding: '12px', background: '#F8F9FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{q.text}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--gdg-blue)', marginTop: '2px', fontWeight: 'bold' }}>{q.type.toUpperCase()}</span>
                    </div>
                    <button className="gdg-share-icon-btn" style={{ color: 'var(--gdg-error)' }} onClick={() => setSurveyQuestions(prev => prev.filter(s => s.id !== q.id))}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Add Survey Question">
              <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Question Text</label>
                  <input type="text" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} required placeholder="e.g. Rate your experience" />
                </div>
                <div className="form-group">
                  <label>Question Type</label>
                  <select value={newQuestionType} onChange={e => setNewQuestionType(e.target.value)}>
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="Free Text">Free Text</option>
                    <option value="Star Rating">Star Rating (1-5)</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit">Add Question</button>
              </form>
            </DashboardCard>
          </div>
        )}

        {/* SPONSORS TAB */}
        {tab === 'sponsors' && (
          <div className="gdg-grid-2-1">
            <DashboardCard title="Event Sponsor Tier Placements">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {eventSponsors.length === 0 ? (
                  <p style={{ fontStyle: 'italic', color: 'var(--gdg-text-secondary)', fontSize: '13px', gridColumn: 'span 2' }}>
                    No sponsors assigned to this event yet.
                  </p>
                ) : null}
                {eventSponsors.map(placement => {
                  const s = placement.sponsor_details;
                  if (!s) return null;
                  const tier = placement.tier_override || s.tier;
                  return (
                    <div key={placement.id} style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', padding: '16px', background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ 
                          display: 'block', 
                          color: tier === 'platinum' ? 'var(--gdg-blue)' : tier === 'gold' ? '#FBBC05' : tier === 'silver' ? '#7C4DFF' : '#9AA0A6', 
                          fontSize: '11px', 
                          marginBottom: '8px',
                          textTransform: 'uppercase'
                        }}>
                          {tier} PLACEMENT
                        </strong>
                        <h4 style={{ margin: 0, fontSize: '15px' }}>{s.name}</h4>
                      </div>
                      <button 
                        className="gdg-share-icon-btn" 
                        style={{ color: 'var(--gdg-error)' }} 
                        onClick={() => handleRemoveSponsorPlacement(placement.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>

            <DashboardCard title="Assign Chapter Sponsor">
              {addingSponsor ? (
                <form onSubmit={handleAssignSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label>Select Sponsor</label>
                    <select value={selectedSponsorId} onChange={e => setSelectedSponsorId(e.target.value)} required>
                      <option value="">-- Choose Sponsor --</option>
                      {allSponsors.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.tier})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tier Override (Optional)</label>
                    <select value={sponsorTierOverride} onChange={e => setSponsorTierOverride(e.target.value)}>
                      <option value="gold">Gold Sponsor</option>
                      <option value="silver">Silver Sponsor</option>
                      <option value="bronze">Bronze Sponsor</option>
                      <option value="platinum">Platinum Sponsor</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Assign</button>
                    <button className="btn btn-secondary" type="button" onClick={() => setAddingSponsor(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div 
                  onClick={() => setAddingSponsor(true)}
                  style={{ border: '1px dashed var(--gdg-border)', borderRadius: '6px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F8F9FA' }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--gdg-blue)', fontWeight: 600 }}>+ Assign Chapter Sponsor</span>
                </div>
              )}
            </DashboardCard>
          </div>
        )}

        {/* COMMUNICATIONS TAB */}
        {tab === 'communications' && (
          <div className="gdg-grid-2-1">
            <DashboardCard title="Event Announcement Dispatcher">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!annSubject) return;
                setAnnouncements(prev => [...prev, { id: Date.now(), subject: annSubject, date: new Date().toLocaleDateString(), recipients: 'Confirmed Attendees' }]);
                setAnnSubject('');
                setAnnBody('');
                alert('Announcement successfully dispatched!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Announcement Subject</label>
                  <input type="text" value={annSubject} onChange={e => setAnnSubject(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Message details</label>
                  <textarea value={annBody} onChange={e => setAnnBody(e.target.value)} rows={3} required />
                </div>
                <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
                  <Send size={12} />
                  <span>Send Announcement</span>
                </button>
              </form>
            </DashboardCard>

            <DashboardCard title="Dispatched Log history">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {announcements.map(ann => (
                  <div key={ann.id} style={{ padding: '10px', border: '1px solid var(--gdg-border)', borderRadius: '6px', fontSize: '12px', background: '#F8F9FA' }}>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{ann.subject}</strong>
                    <span style={{ display: 'block', color: 'var(--gdg-text-secondary)', marginTop: '4px' }}>Date: {ann.date} | Recipients: {ann.recipients}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="gdg-grid-2-1">
              {/* Registration Trend Chart */}
              <DashboardCard title="Registration trend over time">
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationTrends}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--gdg-blue)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--gdg-blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#9AA0A6" fontSize={11} />
                      <YAxis stroke="#9AA0A6" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="var(--gdg-blue)" fillOpacity={1} fill="url(#colorReg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              {/* Registration Source */}
              <DashboardCard title="Registration referral source">
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={registrationSourceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#9AA0A6" fontSize={10} />
                      <YAxis stroke="#9AA0A6" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--gdg-purple)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>
            </div>
            
          </div>
        )}

        {/* WRAP UP TAB */}
        {tab === 'wrapup' && (
          <DashboardCard title="Post-Event Wrap Up Resources" className="max-w-xl">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Slide Deck Link URL</label>
                <input type="url" placeholder="https://docs.google.com/presentation/..." style={{ width: '100%' }} />
              </div>
              <div className="form-group">
                <label>Resource Folder Link</label>
                <input type="url" placeholder="https://github.com/GDG-chapter/..." style={{ width: '100%' }} />
              </div>
              <div className="form-group">
                <label>Wrap Up Summary Editor</label>
                <textarea rows={4} placeholder="Thank you attendees for joining... The code lab files are uploaded below." style={{ width: '100%' }} />
              </div>
              <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Resources saved!')}>
                Save Wrap Up Assets
              </button>
            </div>
          </DashboardCard>
        )}

      </div>
    </DashboardShell>
  );
}
