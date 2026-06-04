import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChapter } from '../contexts/ChapterContext';

export default function ChapterPage() {
  const { slug } = useParams();
  const { apiRequest } = useAuth();
  const { chapters, selectChapter, activeChapter } = useChapter();

  const [events, setEvents] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating a discussion thread
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [threadError, setThreadError] = useState('');

  const fetchChapterDetails = async () => {
    // Find chapter in context or fetch
    const chapter = chapters.find(c => c.slug === slug);
    if (chapter) {
      selectChapter(chapter);
    }
  };

  const fetchEventsAndThreads = async () => {
    setLoading(true);
    const eventsPromise = apiRequest(`/api/v1/events/?chapter=${slug}`, 'GET', null, false);
    const threadsPromise = apiRequest(`/api/v1/discussions/?chapter=${slug}`, 'GET', null, false);
    
    const [evRes, thRes] = await Promise.all([eventsPromise, threadsPromise]);
    if (evRes.status === 200) setEvents(evRes.data);
    if (thRes.status === 200) setThreads(thRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChapterDetails();
  }, [slug, chapters]);

  useEffect(() => {
    if (activeChapter && activeChapter.slug === slug) {
      fetchEventsAndThreads();
    }
  }, [activeChapter, slug]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    setThreadError('');
    if (!activeChapter) return;

    const { status, data } = await apiRequest('/api/v1/discussions/', 'POST', {
      chapter: activeChapter.id,
      title: threadTitle,
      content: threadContent
    }, true);

    if (status === 201) {
      setThreadTitle('');
      setThreadContent('');
      // Refresh discussions
      const { status: loadStatus, data: loadData } = await apiRequest(`/api/v1/discussions/?chapter=${slug}`, 'GET', null, false);
      if (loadStatus === 200) setThreads(loadData);
    } else {
      setThreadError(data.detail || 'Could not post thread. Make sure you are logged in.');
    }
  };

  if (!activeChapter) {
    return <div style={{ padding: '24px' }}><p>Retrieving chapter information...</p></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Chapter Branding Hero */}
      <section className="card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--primary)', padding: '24px' }}>
        <h2>{activeChapter.name}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px' }}>{activeChapter.description}</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '13px', fontWeight: 'bold' }}>
          <span>📍 {activeChapter.location}</span>
          <span>📅 Created: {new Date(activeChapter.created_at).toLocaleDateString()}</span>
        </div>
      </section>

      {/* Grid: Events & Discussions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Events Column */}
        <div>
          <h3>📅 Local Chapter Events</h3>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '16px' }}>Loading timeline...</p>
          ) : (
            <div className="item-list">
              {events.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active upcoming events listed.</p>
              ) : null}
              {events.map(event => (
                <div key={event.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <h4>{event.title}</h4>
                    <span style={{ fontSize: '11px', background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{event.status.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{event.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px' }}>📍 {event.venue} | Cap: {event.capacity} | RSVPs: {event.registration_count}</span>
                    <Link to={`/events/${event.id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>View Detail</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discussions Column */}
        <div>
          <h3>💬 Forum Discussions</h3>
          
          {/* Post Thread Card */}
          <div className="card" style={{ padding: '16px', margin: '16px 0 24px' }}>
            <h4 style={{ margin: '0 0 12px' }}>Start Conversation</h4>
            {threadError && <p style={{ color: '#ef4444', fontSize: '11px', marginBottom: '8px' }}>{threadError}</p>}
            <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Topic Title" 
                value={threadTitle} 
                onChange={e => setThreadTitle(e.target.value)} 
                required 
                style={{ padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              />
              <textarea 
                placeholder="Write message details..." 
                value={threadContent} 
                onChange={e => setThreadContent(e.target.value)} 
                required 
                rows={2}
                style={{ padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', resize: 'none' }}
              />
              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} type="submit">Post Thread</button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {threads.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>No discussions started yet.</p>
            ) : null}
            {threads.map(thread => (
              <div key={thread.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                <h4 style={{ margin: '0', fontSize: '14px' }}>{thread.title}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0' }}>{thread.content.substring(0, 60)}...</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px' }}>
                  <span>✍️ {thread.author.name}</span>
                  <span style={{ color: 'var(--primary)' }}>Replies: {thread.comment_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
