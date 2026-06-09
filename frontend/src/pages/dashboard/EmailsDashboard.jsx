import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { Mail, Plus, Send, RefreshCw, MoreVertical, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function EmailsDashboard() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [subject, setSubject] = useState('Welcome to GDG Coimbatore!');
  const [body, setBody] = useState('We are excited to share details about our upcoming code labs and hackathons. RSVP online!');
  const [audience, setAudience] = useState('all');

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
      setMsg('Campaign draft saved successfully!');
      fetchCampaigns();
    } else {
      setErr('Failed to create campaign draft.');
    }
  };

  const handleSendCampaign = async (id) => {
    setMsg('');
    setErr('');
    const { status } = await apiRequest(`/api/v1/campaigns/${id}/send/`, 'POST', {}, true);
    if (status === 200) {
      setMsg('Campaign emails dispatched successfully!');
      fetchCampaigns();
    } else {
      setErr('Could not send campaign.');
    }
  };

  return (
    <DashboardShell sectionTitle="Emails">
      <div className="gdg-grid-2-1">
        
        {/* Left Column (Composer form) */}
        <div className="card">
          <h3>Create Email Campaign</h3>
          
          {msg && <div style={{ background: '#E6F4EA', color: 'var(--gdg-success)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{msg}</div>}
          {err && <div style={{ background: '#FCE8E6', color: 'var(--gdg-error)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{err}</div>}

          <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Subject Line</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  required 
                  placeholder="e.g. Workshop schedule updates" 
                />
              </div>
              <div className="form-group">
                <label>Target Audience</label>
                <select value={audience} onChange={e => setAudience(e.target.value)}>
                  <option value="all">All Chapter Members</option>
                  <option value="registrants">Confirmed Event Registrants</option>
                  <option value="waitlist">Waitlist Queues Only</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Message Body Content</label>
              <textarea 
                value={body} 
                onChange={e => setBody(e.target.value)} 
                rows={5} 
                required 
                placeholder="Write your email body here..." 
              />
            </div>

            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
              <Plus size={16} />
              <span>Save Campaign Draft</span>
            </button>
          </form>
        </div>

        {/* Right Column (List of campaigns) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Active Campaigns</h3>
            <button className="gdg-share-icon-btn" onClick={fetchCampaigns}><RefreshCw size={14} /></button>
          </div>

          {loading ? (
            <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Loading campaigns...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {campaigns.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>No campaigns drafted yet.</p>
              ) : null}
              {campaigns.map(c => (
                <div key={c.id} style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Mail size={16} className="text-gray-500" style={{ marginTop: '2px' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{c.subject}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>Audience: {c.audience} | Status: <strong style={{ textTransform: 'capitalize' }}>{c.status}</strong></p>
                    </div>
                  </div>
                  {c.status === 'draft' ? (
                    <button 
                      className="btn btn-success" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleSendCampaign(c.id)}
                    >
                      <Send size={11} />
                      <span>Dispatch</span>
                    </button>
                  ) : (
                    <span style={{ color: 'var(--gdg-success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500 }}>
                      <CheckCircle2 size={12} />
                      Sent
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
