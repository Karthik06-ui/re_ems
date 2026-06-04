import { useState, useEffect } from 'react'
import './App.css'

const BASE_URL = 'http://localhost:8000';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('auth');
  
  // Auth Session State
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  });

  // Telemetry Logs & Console Output
  const [logs, setLogs] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState('// API console outputs will display here...\n');

  // Directory lists
  const [chapters, setChapters] = useState([]);
  const [events, setEvents] = useState([]);
  const [threads, setThreads] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Active Contexts
  const [selectedChapterSlug, setSelectedChapterSlug] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  // Authentication Forms
  const [regEmail, setRegEmail] = useState('developer@chapter.com');
  const [regName, setRegName] = useState('Karthik S');
  const [regPassword, setRegPassword] = useState('supersecret123');
  const [loginEmail, setLoginEmail] = useState('developer@chapter.com');
  const [loginPassword, setLoginPassword] = useState('supersecret123');

  // Chapter Forms
  const [chName, setChName] = useState('GDG Seattle');
  const [chSlug, setChSlug] = useState('gdg-seattle');
  const [chLocation, setChLocation] = useState('Seattle, WA');
  const [chDesc, setChDesc] = useState('Google Developer Group Seattle regional chapter.');
  const [roleEmail, setRoleEmail] = useState('developer@chapter.com');
  const [roleValue, setRoleValue] = useState('organizer');

  // Event Forms
  const [evTitle, setEvTitle] = useState('Global Tech Summit 2026');
  const [evDesc, setEvDesc] = useState('Join us for the premier community engineering developer summit.');
  const [evType, setEvType] = useState('physical');
  const [evCapacity, setEvCapacity] = useState('50');
  const [evVenue, setEvVenue] = useState('Seattle Convention Center');

  // Forum Forms
  const [threadTitle, setThreadTitle] = useState('Welcome to GDG Seattle!');
  const [threadContent, setThreadContent] = useState('Hello engineering team, please leave your intro posts here!');
  const [commentContent, setCommentContent] = useState('This is a test comment from the sandbox.');
  const [activeParentCommentId, setActiveParentCommentId] = useState('');

  // Sponsor Forms
  const [spName, setSpName] = useState('Google Cloud');
  const [spWebsite, setSpWebsite] = useState('https://cloud.google.com');
  const [spTier, setSpTier] = useState('gold');

  // Campaign Forms
  const [cpSubject, setCpSubject] = useState('GDG Seattle - Monthly Newsletter');
  const [cpBody, setCpBody] = useState('Hello chapter members, we are scheduling our next developer event! RSVP online.');
  const [cpAudience, setCpAudience] = useState('all');

  // Central Request Handler
  const apiRequest = async (urlPath, method = 'GET', body = null, authRequired = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const headers = { 'Content-Type': 'application/json' };
    
    let token = accessToken;
    if (authRequired && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const fullUrl = `${BASE_URL}${urlPath}`;
    
    try {
      let response = await fetch(fullUrl, options);
      
      // Token Refresh logic if 401 Unauthorized occurs
      if (response.status === 401 && authRequired && refreshToken) {
        setLogs(prev => [...prev, {
          timestamp,
          method: 'POST',
          url: '/api/v1/auth/token/refresh/',
          status: 'REFRESHING',
          details: 'Access token expired. Refreshing...'
        }]);

        const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });

        if (refreshResponse.status === 200) {
          const refreshData = await refreshResponse.json();
          const newAccess = refreshData.access;
          
          setAccessToken(newAccess);
          localStorage.setItem('access_token', newAccess);
          
          // Retry the original query
          headers['Authorization'] = `Bearer ${newAccess}`;
          response = await fetch(fullUrl, options);
        } else {
          // Refresh token invalid/expired, log user out
          handleLogout();
          throw new Error("Session expired. Please log in again.");
        }
      }

      const statusText = `${response.status} ${response.statusText}`;
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = { message: "No JSON payload returned" };
      }

      // Add to transaction logs
      setLogs(prev => [{
        timestamp,
        method,
        url: urlPath,
        status: statusText,
        statusCode: response.status
      }, ...prev]);

      setConsoleOutput(`// ${method} ${urlPath} (${statusText})\n${JSON.stringify(data, null, 2)}`);
      return { status: response.status, data };

    } catch (error) {
      setLogs(prev => [{
        timestamp,
        method,
        url: urlPath,
        status: 'CONNECTION_ERROR',
        statusCode: 500
      }, ...prev]);
      setConsoleOutput(`// Connection Failure\nError connecting to ${fullUrl}\n${error.message}`);
      return { status: 500, data: { error: error.message } };
    }
  };

  // Auth Operations
  const handleRegister = async (e) => {
    e.preventDefault();
    const { status, data } = await apiRequest('/api/v1/auth/register/', 'POST', {
      email: regEmail,
      name: regName,
      password: regPassword
    });
    if (status === 201) {
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setCurrentUser(data.user);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { status, data } = await apiRequest('/api/v1/auth/token/', 'POST', {
      email: loginEmail,
      password: loginPassword
    });
    if (status === 200) {
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setCurrentUser(data.user);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  };

  const fetchProfile = async () => {
    const { status, data } = await apiRequest('/api/v1/auth/me/', 'GET', null, true);
    if (status === 200) {
      setCurrentUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    }
  };

  const handleLogout = () => {
    setAccessToken('');
    setRefreshToken('');
    setCurrentUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setConsoleOutput('// Logged out successfully. Tokens destroyed.');
  };

  // Chapter Operations
  const fetchChapters = async () => {
    const { status, data } = await apiRequest('/api/v1/chapters/', 'GET');
    if (status === 200) {
      setChapters(data);
      if (data.length > 0 && !selectedChapterSlug) {
        setSelectedChapterSlug(data[0].slug);
      }
    }
  };

  const createChapter = async (e) => {
    e.preventDefault();
    const { status } = await apiRequest('/api/v1/chapters/', 'POST', {
      name: chName,
      slug: chSlug,
      location: chLocation,
      description: chDesc
    }, true);
    if (status === 201) {
      fetchChapters();
    }
  };

  const assignChapterRole = async (e) => {
    e.preventDefault();
    if (!selectedChapterSlug) return;
    await apiRequest(`/api/v1/chapters/${selectedChapterSlug}/roles/`, 'POST', {
      user_email: roleEmail,
      role: roleValue
    }, true);
  };

  // Event Operations
  const fetchEvents = async () => {
    const url = selectedChapterSlug ? `/api/v1/events/?chapter=${selectedChapterSlug}` : '/api/v1/events/';
    const { status, data } = await apiRequest(url, 'GET');
    if (status === 200) {
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    const targetChapter = chapters.find(c => c.slug === selectedChapterSlug);
    if (!targetChapter) {
      alert("Please select or create a chapter first.");
      return;
    }
    const start_time = new Date();
    start_time.setDate(start_time.getDate() + 1); // 1 day in future
    const end_time = new Date(start_time.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    const { status } = await apiRequest('/api/v1/events/', 'POST', {
      chapter: targetChapter.id,
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
      fetchEvents();
    }
  };

  const registerForEvent = async (eventId) => {
    const { status } = await apiRequest(`/api/v1/events/${eventId}/register/`, 'POST', {}, true);
    if (status === 201 || status === 202) {
      fetchEvents();
    }
  };

  const cancelEventRegistration = async (eventId) => {
    const { status } = await apiRequest(`/api/v1/events/${eventId}/cancel/`, 'POST', {}, true);
    if (status === 200) {
      fetchEvents();
    }
  };

  const checkinAttendee = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;
    const email = prompt("Enter attendee email address to check-in:");
    if (!email) return;
    await apiRequest(`/api/v1/events/${selectedEventId}/checkin/`, 'POST', { email }, true);
  };

  // Discussions Operations
  const fetchThreads = async () => {
    const url = selectedChapterSlug ? `/api/v1/discussions/?chapter=${selectedChapterSlug}` : '/api/v1/discussions/';
    const { status, data } = await apiRequest(url, 'GET');
    if (status === 200) {
      setThreads(data);
    }
  };

  const createThread = async (e) => {
    e.preventDefault();
    const targetChapter = chapters.find(c => c.slug === selectedChapterSlug);
    if (!targetChapter) return;
    const { status } = await apiRequest('/api/v1/discussions/', 'POST', {
      chapter: targetChapter.id,
      title: threadTitle,
      content: threadContent
    }, true);
    if (status === 201) {
      fetchThreads();
    }
  };

  const viewComments = async (threadId) => {
    await apiRequest(`/api/v1/discussions/${threadId}/comments/`, 'GET', null, true);
  };

  const postComment = async (threadId) => {
    const parentId = activeParentCommentId ? parseInt(activeParentCommentId) : null;
    const { status } = await apiRequest(`/api/v1/discussions/${threadId}/comments/`, 'POST', {
      content: commentContent,
      parent: parentId
    }, true);
    if (status === 201) {
      setCommentContent('');
      setActiveParentCommentId('');
      viewComments(threadId);
    }
  };

  // Sponsors Operations
  const fetchSponsors = async () => {
    const { status, data } = await apiRequest('/api/v1/sponsors/', 'GET');
    if (status === 200) {
      setSponsors(data);
    }
  };

  const createSponsor = async (e) => {
    e.preventDefault();
    const targetChapter = chapters.find(c => c.slug === selectedChapterSlug);
    if (!targetChapter) return;
    const { status } = await apiRequest('/api/v1/sponsors/', 'POST', {
      chapter: targetChapter.id,
      name: spName,
      website: spWebsite,
      tier: spTier
    }, true);
    if (status === 201) {
      fetchSponsors();
    }
  };

  const associateSponsorToEvent = async (eventId, sponsorId) => {
    await apiRequest('/api/v1/sponsors/event-placements/', 'POST', {
      event: eventId,
      sponsor: sponsorId
    }, true);
  };

  // Campaigns Operations
  const fetchCampaigns = async () => {
    const { status, data } = await apiRequest('/api/v1/campaigns/', 'GET', null, true);
    if (status === 200) {
      setCampaigns(data);
    }
  };

  const createCampaign = async (e) => {
    e.preventDefault();
    const targetChapter = chapters.find(c => c.slug === selectedChapterSlug);
    if (!targetChapter) return;
    const { status } = await apiRequest('/api/v1/campaigns/', 'POST', {
      chapter: targetChapter.id,
      subject: cpSubject,
      body: cpBody,
      audience: cpAudience
    }, true);
    if (status === 201) {
      fetchCampaigns();
    }
  };

  const sendCampaign = async (campaignId) => {
    await apiRequest(`/api/v1/campaigns/${campaignId}/send/`, 'POST', {}, true);
    fetchCampaigns();
  };

  // Analytics Operations
  const fetchAnalytics = async () => {
    const url = selectedChapterSlug ? `/api/v1/analytics/overview/?chapter=${selectedChapterSlug}` : '/api/v1/analytics/overview/';
    const { status, data } = await apiRequest(url, 'GET', null, true);
    if (status === 200) {
      setAnalytics(data);
    }
  };

  // Trigger base fetches on load
  useEffect(() => {
    fetchChapters();
    fetchSponsors();
  }, []);

  // Update lists when chapter context changes
  useEffect(() => {
    if (selectedChapterSlug) {
      fetchEvents();
      fetchThreads();
      fetchAnalytics();
    }
  }, [selectedChapterSlug]);

  return (
    <div className="sandbox-container">
      {/* HEADER SECTION */}
      <header className="sandbox-header">
        <div className="header-title">
          <h1>Community Platform Sandbox</h1>
          <p>Directly inspect, invoke, and test Django REST Framework backend APIs</p>
        </div>
        <div className="header-status">
          <div className="status-badge connected">
            <span className="status-dot">●</span> Connected to Backend (8000)
          </div>
          {currentUser ? (
            <div className="session-info">
              <span>👤 {currentUser.name} ({currentUser.email})</span>
              <span className="role-tag">{currentUser.role}</span>
              <button className="btn btn-danger" style={{padding: '2px 8px', fontSize: '11px'}} onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="session-info" style={{color: 'var(--danger)'}}>
              🔑 Unauthenticated Session
            </div>
          )}
        </div>
      </header>

      {/* BODY GRID */}
      <div className="sandbox-body">
        {/* SIDEBAR TABS */}
        <nav className="sandbox-sidebar">
          <div className="sidebar-menu">
            <button className={`menu-btn ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>🔑 Authentication</button>
            <button className={`menu-btn ${activeTab === 'chapters' ? 'active' : ''}`} onClick={() => setActiveTab('chapters')}>🏢 Chapters & Roles</button>
            <button className={`menu-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => { setActiveTab('events'); fetchEvents(); }}>📅 Events & RSVPs</button>
            <button className={`menu-btn ${activeTab === 'discussions' ? 'active' : ''}`} onClick={() => { setActiveTab('discussions'); fetchThreads(); }}>💬 Discussion Forums</button>
            <button className={`menu-btn ${activeTab === 'sponsors' ? 'active' : ''}`} onClick={() => { setActiveTab('sponsors'); fetchSponsors(); }}>🤝 Sponsors & Partners</button>
            <button className={`menu-btn ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => { setActiveTab('campaigns'); fetchCampaigns(); }}>✉️ Campaigns</button>
            <button className={`menu-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}>📈 Telemetry Analytics</button>
          </div>
          
          <div className="chapter-selector-card" style={{padding: '12px', borderTop: '1px solid var(--border-color)', marginTop: '20px'}}>
            <label style={{fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px'}}>ACTIVE CHAPTER CONTEXT</label>
            <select 
              value={selectedChapterSlug} 
              onChange={(e) => setSelectedChapterSlug(e.target.value)}
              style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)'}}
            >
              <option value="">No Active Chapter</option>
              {chapters.map(c => <option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>)}
            </select>
            <button className="btn btn-secondary" style={{width: '100%', marginTop: '6px', fontSize: '11px', padding: '4px'}} onClick={fetchChapters}>🔄 Refresh Chapters</button>
          </div>
        </nav>

        {/* WORKSPACE AREA */}
        <div className="sandbox-content">
          <main className="sandbox-workspace">
            {/* AUTHENTICATION TAB */}
            {activeTab === 'auth' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <h2>Authentication Management</h2>
                  <p>Create new users, log in, and retrieve active profiles via JSON Web Tokens.</p>
                </div>
                
                <div className="form-grid">
                  <div className="card">
                    <h3>Register New User</h3>
                    <form onSubmit={handleRegister}>
                      <div className="form-grid full">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input type="text" value={regName} onChange={e => setRegName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Password</label>
                          <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                        </div>
                      </div>
                      <button className="btn btn-primary" type="submit">Submit Registration</button>
                    </form>
                  </div>

                  <div className="card">
                    <h3>User Login (JWT Token obtain)</h3>
                    <form onSubmit={handleLogin}>
                      <div className="form-grid full">
                        <div className="form-group">
                          <label>Email Address</label>
                          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Password</label>
                          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                        </div>
                      </div>
                      <button className="btn btn-primary" type="submit">Authenticate Session</button>
                    </form>
                  </div>
                </div>

                {currentUser && (
                  <div className="card">
                    <h3>Profile Operations</h3>
                    <p style={{marginBottom: '16px'}}>Fetch or partial update settings metadata for currently logged in token profile.</p>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button className="btn btn-secondary" onClick={fetchProfile}>Get Profile Details (/me/)</button>
                      <button className="btn btn-secondary" onClick={async () => {
                        const newName = prompt("Enter new profile name:", currentUser.name);
                        if (newName) {
                          await apiRequest('/api/v1/auth/me/', 'PATCH', { name: newName }, true);
                          fetchProfile();
                        }
                      }}>Update Profile Name</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHAPTERS TAB */}
            {activeTab === 'chapters' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <h2>Chapters & Tenancies</h2>
                  <p>Organize tenant boundaries, slug pathways, and chapter role directories.</p>
                </div>

                <div className="card">
                  <h3>Create Regional Chapter</h3>
                  <form onSubmit={createChapter}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Chapter Name</label>
                        <input type="text" value={chName} onChange={e => setChName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Chapter Slug (Unique)</label>
                        <input type="text" value={chSlug} onChange={e => setChSlug(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Location</label>
                        <input type="text" value={chLocation} onChange={e => setChLocation(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <input type="text" value={chDesc} onChange={e => setChDesc(e.target.value)} />
                      </div>
                    </div>
                    <button className="btn btn-primary" type="submit">Create Chapter</button>
                  </form>
                </div>

                <div className="form-grid">
                  <div className="card">
                    <h3>Assign Chapter Roles</h3>
                    <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                      Context: <strong>{selectedChapterSlug || 'Select a chapter in sidebar'}</strong>
                    </p>
                    <form onSubmit={assignChapterRole}>
                      <div className="form-grid full">
                        <div className="form-group">
                          <label>Member Email</label>
                          <input type="email" value={roleEmail} onChange={e => setRoleEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Chapter Role</label>
                          <select value={roleValue} onChange={e => setRoleValue(e.target.value)}>
                            <option value="member">Member</option>
                            <option value="organizer">Organizer</option>
                            <option value="chapter_lead">Chapter Lead</option>
                          </select>
                        </div>
                      </div>
                      <button className="btn btn-primary" type="submit" disabled={!selectedChapterSlug}>Apply Role Override</button>
                    </form>
                  </div>

                  <div className="card">
                    <h3>Chapter Members & Roles Directory</h3>
                    <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                      Context: <strong>{selectedChapterSlug || 'Select a chapter in sidebar'}</strong>
                    </p>
                    <button className="btn btn-secondary" onClick={async () => {
                      if (selectedChapterSlug) {
                        await apiRequest(`/api/v1/chapters/${selectedChapterSlug}/roles/`, 'GET', null, true);
                      }
                    }} disabled={!selectedChapterSlug}>Query Members Directory</button>
                  </div>
                </div>
              </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === 'events' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <h2>Events Builder & Capacity Reservations</h2>
                  <p>Design event instances, test transactional reservations, check capacity metrics, and promotion waitlists.</p>
                </div>

                <div className="card">
                  <h3>Build Chapter Event</h3>
                  <form onSubmit={createEvent}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Event Title</label>
                        <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Capacity Seating Limit</label>
                        <input type="number" value={evCapacity} onChange={e => setEvCapacity(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Venue (or Link)</label>
                        <input type="text" value={evVenue} onChange={e => setEvVenue(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Event Format</label>
                        <select value={evType} onChange={e => setEvType(e.target.value)}>
                          <option value="physical">Physical</option>
                          <option value="virtual">Virtual</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{marginTop: '12px', marginBottom: '16px'}}>
                      <label>Description Details</label>
                      <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} rows={2}></textarea>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={!selectedChapterSlug}>Publish Event Instance</button>
                  </form>
                </div>

                <div className="card">
                  <h3>Events Index under Chapter</h3>
                  <div className="item-list">
                    {events.length === 0 ? <p style={{fontSize: '13px', color: 'var(--text-secondary)'}}>No events found for this chapter.</p> : null}
                    {events.map(event => (
                      <div className="list-item" key={event.id}>
                        <div className="item-details">
                          <h4>{event.title}</h4>
                          <p>📍 {event.venue} | Seating Cap: {event.capacity} | RSVPs: {event.registration_count} | Waitlist: {event.waitlist_count}</p>
                        </div>
                        <div className="item-actions">
                          <button className="btn btn-success" onClick={() => registerForEvent(event.id)}>RSVP Seat</button>
                          <button className="btn btn-danger" onClick={() => cancelEventRegistration(event.id)}>Cancel RSVP</button>
                          <button className="btn btn-secondary" onClick={() => { setSelectedEventId(event.id); alert(`Event ${event.title} selected for Check-ins/Placements.`); }}>Select</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedEventId && (
                  <div className="card">
                    <h3>On-Site Attendee Check-In Verification</h3>
                    <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                      Selected Event ID: <strong>{selectedEventId}</strong>
                    </p>
                    <button className="btn btn-secondary" onClick={checkinAttendee}>Trigger QR Code / Manual Check-In</button>
                  </div>
                )}
              </div>
            )}

            {/* FORUMS TAB */}
            {activeTab === 'discussions' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <h2>Discussion Forums & Comments</h2>
                  <p>Start conversation threads and write reply comments (up to 2 levels of nested depth).</p>
                </div>

                <div className="card">
                  <h3>Create New Thread</h3>
                  <form onSubmit={createThread}>
                    <div className="form-grid full">
                      <div className="form-group">
                        <label>Thread Title</label>
                        <input type="text" value={threadTitle} onChange={e => setThreadTitle(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Post Content</label>
                        <textarea value={threadContent} onChange={e => setThreadContent(e.target.value)} rows={3} required></textarea>
                      </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={!selectedChapterSlug}>Submit Topic</button>
                  </form>
                </div>

                <div className="card">
                  <h3>Conversations Stream</h3>
                  <div className="item-list">
                    {threads.length === 0 ? <p style={{fontSize: '13px', color: 'var(--text-secondary)'}}>No discussion topics started yet.</p> : null}
                    {threads.map(thread => (
                      <div style={{border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px'}} key={thread.id}>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <h4>{thread.title}</h4>
                          <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Comments: {thread.comment_count}</span>
                        </div>
                        <p style={{fontSize: '13px', margin: '8px 0'}}>{thread.content}</p>
                        
                        <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                          <button className="btn btn-secondary" style={{fontSize: '11px', padding: '4px 8px'}} onClick={() => viewComments(thread.id)}>View Comments</button>
                          <button className="btn btn-secondary" style={{fontSize: '11px', padding: '4px 8px'}} onClick={() => {
                            const parentId = prompt("Enter parent comment ID to reply (leave blank for top-level comment):");
                            setActiveParentCommentId(parentId || '');
                            postComment(thread.id);
                          }}>Add Reply</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SPONSORS TAB */}
            {activeTab === 'sponsors' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <h2>Sponsorship Directories & Placements</h2>
                  <p>Define sponsors, manage tiers, and link them to active event listings.</p>
                </div>

                <div className="card">
                  <h3>Add Sponsor</h3>
                  <form onSubmit={createSponsor}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Sponsor Name</label>
                        <input type="text" value={spName} onChange={e => setSpName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Website URL</label>
                        <input type="url" value={spWebsite} onChange={e => setSpWebsite(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Sponsorship Tier</label>
                        <select value={spTier} onChange={e => setSpTier(e.target.value)}>
                          <option value="gold">Gold</option>
                          <option value="silver">Silver</option>
                          <option value="bronze">Bronze</option>
                        </select>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{marginTop: '12px'}} type="submit" disabled={!selectedChapterSlug}>Save Sponsor</button>
                  </form>
                </div>

                <div className="card">
                  <h3>Sponsor Directory</h3>
                  <div className="item-list">
                    {sponsors.length === 0 ? <p style={{fontSize: '13px', color: 'var(--text-secondary)'}}>No sponsors saved.</p> : null}
                    {sponsors.map(sp => (
                      <div className="list-item" key={sp.id}>
                        <div className="item-details">
                          <h4>{sp.name}</h4>
                          <p>🌐 {sp.website} | Tier: {sp.tier}</p>
                        </div>
                        <div className="item-actions">
                          <button className="btn btn-secondary" style={{fontSize: '11px'}} onClick={() => {
                            if (!selectedEventId) {
                              alert("Please select an event from the Events tab first.");
                              return;
                            }
                            associateSponsorToEvent(selectedEventId, sp.id);
                          }}>Associate with Event ({selectedEventId || 'none selected'})</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CAMPAIGNS TAB */}
            {activeTab === 'campaigns' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <h2>Email Campaigns</h2>
                  <p>Draft campaigns and dispatch them asynchronously to chapter segments.</p>
                </div>

                <div className="card">
                  <h3>Create Email Campaign</h3>
                  <form onSubmit={createCampaign}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Email Subject</label>
                        <input type="text" value={cpSubject} onChange={e => setCpSubject(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Audience Segment</label>
                        <select value={cpAudience} onChange={e => setCpAudience(e.target.value)}>
                          <option value="all">All Chapter Members</option>
                          <option value="registrants">Confirmed Event Registrants</option>
                          <option value="waitlist">Waitlisted Registrants</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{marginTop: '12px', marginBottom: '16px'}}>
                      <label>Email Body</label>
                      <textarea value={cpBody} onChange={e => setCpBody(e.target.value)} rows={3} required></textarea>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={!selectedChapterSlug}>Save Campaign</button>
                  </form>
                </div>

                <div className="card">
                  <h3>Campaign Logs</h3>
                  <div className="item-list">
                    {campaigns.length === 0 ? <p style={{fontSize: '13px', color: 'var(--text-secondary)'}}>No campaigns drafted yet.</p> : null}
                    {campaigns.map(cp => (
                      <div className="list-item" key={cp.id}>
                        <div className="item-details">
                          <h4>{cp.subject}</h4>
                          <p>Audience: {cp.audience} | Status: <strong>{cp.status.toUpperCase()}</strong></p>
                        </div>
                        <div className="item-actions">
                          <button className="btn btn-success" onClick={() => sendCampaign(cp.id)} disabled={cp.status === 'sent'}>Dispatch Campaign</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <h2>Telemetry Analytics</h2>
                  <p>Track metrics rollups, active users, growth numbers, and member counts.</p>
                </div>

                <div className="card">
                  <h3>Overview Aggregates</h3>
                  <button className="btn btn-secondary" onClick={fetchAnalytics} disabled={!selectedChapterSlug}>Fetch Analytics Metrics</button>
                  
                  {analytics && (
                    <div className="analytics-grid" style={{marginTop: '20px'}}>
                      <div className="stat-card">
                        <div style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>TOTAL MEMBERS</div>
                        <div className="stat-val">{analytics.total_members}</div>
                      </div>
                      <div className="stat-card">
                        <div style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>TOTAL EVENTS</div>
                        <div className="stat-val">{analytics.total_events}</div>
                      </div>
                      <div className="stat-card">
                        <div style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>CONFIRMED RSVPS</div>
                        <div className="stat-val">{analytics.total_registrations}</div>
                      </div>
                      <div className="stat-card">
                        <div style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>ATTENDANCE RATE</div>
                        <div className="stat-val">{analytics.engagement_metrics.attendance_rate}%</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3>Simulate Arbitrary Event Tracking</h3>
                  <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                    Dispatches a custom JSON payload tracking event (e.g. `page_view`, `link_click`) to verify telemetry ingestion works properly.
                  </p>
                  <button className="btn btn-secondary" onClick={async () => {
                    await apiRequest('/api/v1/analytics/track/', 'POST', {
                      event_type: 'page_view',
                      entity_id: selectedChapterSlug || 'platform_root',
                      metadata: { user_agent: navigator.userAgent }
                    }, true);
                  }}>Track Page View event</button>
                </div>
              </div>
            )}
          </main>

          {/* TELEMETRY LOGS / CONSOLE OUTPUT */}
          <aside className="sandbox-console">
            <div className="console-header">
              <h3>📄 API Transaction Logs</h3>
              <button className="btn btn-secondary" style={{padding: '2px 8px', fontSize: '11px'}} onClick={() => setLogs([])}>Clear</button>
            </div>
            <div className="console-body">
              <div className="console-logs">
                {logs.length === 0 ? <p style={{color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0}}>No API requests triggered in this session yet.</p> : null}
                {logs.map((log, idx) => (
                  <div className={`log-entry ${log.method}`} key={idx}>
                    <div className="log-meta">
                      <span className="log-time">{log.timestamp}</span>
                      <span className="log-method">{log.method}</span>
                      <span className={`log-status s${log.statusCode}xx`}>{log.status}</span>
                    </div>
                    <div style={{fontWeight: '500'}}>{log.url}</div>
                  </div>
                ))}
              </div>
              <div className="console-output">
                <pre>{consoleOutput}</pre>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default App
