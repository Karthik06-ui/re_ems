import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { Award, Plus, RefreshCw, Globe, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function SponsorsDashboard() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('Google Cloud');
  const [website, setWebsite] = useState('https://cloud.google.com');
  const [tier, setTier] = useState('gold');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchSponsors = async () => {
    if (!activeChapter) return;
    setLoading(true);
    const { status, data } = await apiRequest('/api/v1/sponsors/', 'GET', null, true);
    if (status === 200) {
      // Filter sponsors for the active chapter
      setSponsors(data.filter(s => s.chapter === activeChapter.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSponsors();
  }, [activeChapter]);

  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    const { status } = await apiRequest('/api/v1/sponsors/', 'POST', {
      chapter: activeChapter.id,
      name,
      website,
      tier
    }, true);

    if (status === 201) {
      setMsg('Sponsor record added to chapter directory!');
      setName('');
      setWebsite('');
      fetchSponsors();
    } else {
      setErr('Failed to add sponsor placement.');
    }
  };

  return (
    <DashboardShell sectionTitle="Sponsors">
      <div className="gdg-grid-2-1">
        
        {/* Left Column (Create form) */}
        <div className="card">
          <h3>Add Sponsor Record</h3>
          
          {msg && <div style={{ background: '#E6F4EA', color: 'var(--gdg-success)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{msg}</div>}
          {err && <div style={{ background: '#FCE8E6', color: 'var(--gdg-error)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{err}</div>}

          <form onSubmit={handleCreateSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Company/Brand Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="e.g. JetBrains" 
              />
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Website URL</label>
                <input 
                  type="url" 
                  value={website} 
                  onChange={e => setWebsite(e.target.value)} 
                  required 
                  placeholder="https://company.com" 
                />
              </div>
              
              <div className="form-group">
                <label>Sponsorship Tier</label>
                <select value={tier} onChange={e => setTier(e.target.value)}>
                  <option value="gold">Gold Tier Sponsor</option>
                  <option value="silver">Silver Tier Sponsor</option>
                  <option value="bronze">Bronze Tier Sponsor</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
              <Plus size={16} />
              <span>Save Sponsor placement</span>
            </button>
          </form>
        </div>

        {/* Right Column (Directory list) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Sponsor Directory</h3>
            <button className="gdg-share-icon-btn" onClick={fetchSponsors}><RefreshCw size={14} /></button>
          </div>

          {loading ? (
            <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Loading sponsors...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sponsors.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>No sponsors placed in this chapter yet.</p>
              ) : null}
              {sponsors.map(s => (
                <div key={s.id} style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Award size={16} className="text-gray-500" style={{ marginTop: '2px' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{s.name}</h4>
                      <a href={s.website} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--gdg-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <Globe size={10} />
                        Visit Website
                      </a>
                    </div>
                  </div>
                  <span className="role-tag" style={{ 
                    backgroundColor: s.tier === 'gold' ? '#FFF3CD' : s.tier === 'silver' ? '#E2E3E5' : '#D1ECF1',
                    color: s.tier === 'gold' ? '#856404' : s.tier === 'silver' ? '#383D41' : '#0C5460',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {s.tier}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
