import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { DashboardCard, StatusBadge } from '../../components/DashboardComponents';
import { Mail, Send, Calendar, Clock, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function CampaignsDashboard() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [subject, setSubject] = useState('Google I/O Extended Coimbatore Recap');
  const [body, setBody] = useState('We covered TensorFlow releases, Gemini updates, and web speeds metrics.');
  const [audience, setAudience] = useState('all');
  const [scheduleDate, setScheduleDate] = useState('2026-06-15');
  const [scheduleTime, setScheduleTime] = useState('18:00');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchCampaigns = async () => {
    if (!activeChapter) return;
    setLoading(true);
    const { status, data } = await apiRequest('/api/v1/campaigns/', 'GET', null, true);
    if (status === 200) {
      setCampaigns(data.filter(c => c.chapter === activeChapter.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeChapter]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    const { status } = await apiRequest('/api/v1/campaigns/', 'POST', {
      chapter: activeChapter.id,
      subject,
      body,
      audience
    }, true);

    if (status === 201) {
      setMsg('Campaign draft successfully saved.');
      fetchCampaigns();
    } else {
      setErr('Failed to save campaign draft.');
    }
  };

  const handleSendImmediately = async (id) => {
    setMsg('');
    setErr('');
    const { status } = await apiRequest(`/api/v1/campaigns/${id}/send/`, 'POST', {}, true);
    if (status === 200) {
      setMsg('Campaign broadcast successfully dispatched.');
      fetchCampaigns();
    } else {
      setErr('Could not dispatch campaign.');
    }
  };

  const handleScheduleCampaign = (id) => {
    alert(`Campaign successfully scheduled for ${scheduleDate} at ${scheduleTime}`);
    setMsg(`Campaign scheduled for: ${scheduleDate} ${scheduleTime}`);
  };

  return (
    <DashboardShell sectionTitle="Campaigns">
      <div className="gdg-grid-2-1">
        
        {/* Left Column (Composer details) */}
        <DashboardCard title="Draft New Email Campaign">
          
          {msg && <div style={{ background: '#E6F4EA', color: 'var(--gdg-success)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{msg}</div>}
          {err && <div style={{ background: '#FCE8E6', color: 'var(--gdg-error)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{err}</div>}

          <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Subject Title</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Target Audience Filter</label>
                <select value={audience} onChange={e => setAudience(e.target.value)}>
                  <option value="all">All Registered Chapter Members</option>
                  <option value="registrants">Confirmed Event Registrants Only</option>
                  <option value="waitlist">Waitlist Seating Queues</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Message Content Body</label>
              <textarea 
                value={body} 
                onChange={e => setBody(e.target.value)} 
                rows={5} 
                required 
              />
            </div>

            {/* Scheduler picker */}
            <div style={{ borderTop: '1px solid var(--gdg-border)', padding: '16px 0 0 0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Schedule Delivery</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Scheduled Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ paddingLeft: '32px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Scheduled Time</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ paddingLeft: '32px' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-primary" type="submit">
                <Plus size={14} />
                <span>Save Draft</span>
              </button>
            </div>
          </form>
        </DashboardCard>

        {/* Right Column (List & Dispatch triggers) */}
        <DashboardCard 
          title="Campaigns Broadcast History"
          action={<button className="gdg-share-icon-btn" onClick={fetchCampaigns}><RefreshCw size={12} /></button>}
        >
          {loading ? (
            <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Syncing dispatch logs...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {campaigns.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--gdg-text-secondary)', fontSize: '13px' }}>No campaigns drafted yet.</p>
              ) : null}
              {campaigns.map(c => (
                <div key={c.id} style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', padding: '12px', background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{c.subject}</h4>
                      <span style={{ fontSize: '10px', color: 'var(--gdg-text-secondary)' }}>Audience: {c.audience}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  
                  {c.status === 'draft' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button 
                        className="btn btn-success" 
                        style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                        onClick={() => handleSendImmediately(c.id)}
                      >
                        <Send size={11} />
                        <span>Send Now</span>
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                        onClick={() => handleScheduleCampaign(c.id)}
                      >
                        <span>Schedule</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

      </div>
    </DashboardShell>
  );
}
