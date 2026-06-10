import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { DashboardCard, StatusBadge } from '../../components/DashboardComponents';
import { Award, Plus, Globe, RefreshCw, BarChart, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function SponsorsDashboard() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();

  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('Google Developers');
  const [website, setWebsite] = useState('https://developers.google.com');
  const [tier, setTier] = useState('platinum');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchSponsorsData = async () => {
    if (!activeChapter) return;
    setLoading(true);
    const { status, data } = await apiRequest('/api/v1/sponsors/', 'GET', null, true);
    if (status === 200) {
      setSponsors(data.filter(s => s.chapter === activeChapter.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSponsorsData();
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
      setMsg('Sponsor registered successfully.');
      setName('');
      setWebsite('');
      fetchSponsorsData();
    } else {
      setErr('Failed to save sponsor placement.');
    }
  };

  const handleDeleteSponsor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sponsor?")) return;
    const { status } = await apiRequest(`/api/v1/sponsors/${id}/`, 'DELETE', null, true);
    if (status === 200 || status === 204) {
      fetchSponsorsData();
    } else {
      alert("Failed to delete sponsor.");
    }
  };

  return (
    <DashboardShell sectionTitle="Sponsors">
      <div className="gdg-grid-2-1">
        
        {/* Left Column (Create sponsor) */}
        <DashboardCard title="Register Chapter Sponsor">
          
          {msg && <div style={{ background: '#E6F4EA', color: 'var(--gdg-success)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{msg}</div>}
          {err && <div style={{ background: '#FCE8E6', color: 'var(--gdg-error)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>{err}</div>}

          <form onSubmit={handleCreateSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Company / Brand Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Website URL</label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Sponsorship Tier</label>
                <select value={tier} onChange={e => setTier(e.target.value)}>
                  <option value="platinum">Platinum Sponsor</option>
                  <option value="gold">Gold Sponsor</option>
                  <option value="silver">Silver Sponsor</option>
                  <option value="bronze">Bronze Sponsor</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>
              <Plus size={16} />
              <span>Save Sponsor Placement</span>
            </button>
          </form>
        </DashboardCard>

        {/* Right Column (List directories) */}
        <DashboardCard 
          title="Sponsors Directories" 
          action={<button className="gdg-share-icon-btn" onClick={fetchSponsorsData}><RefreshCw size={12} /></button>}
        >
          {loading ? (
            <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Syncing sponsor list...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sponsors.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--gdg-text-secondary)', fontSize: '13px' }}>No sponsors added yet.</p>
              ) : null}
              {sponsors.map(s => (
                <div key={s.id} style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Award size={16} className="text-gray-500" style={{ marginTop: '2px' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{s.name}</h4>
                      <a href={s.website} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--gdg-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <Globe size={10} />
                        Website
                      </a>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="role-tag" style={{ 
                      backgroundColor: s.tier === 'platinum' ? '#E8F0FE' : s.tier === 'gold' ? '#FFF3CD' : s.tier === 'silver' ? '#E2E3E5' : '#D1ECF1',
                      color: s.tier === 'platinum' ? 'var(--gdg-blue)' : s.tier === 'gold' ? '#856404' : s.tier === 'silver' ? '#383D41' : '#0C5460',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {s.tier}
                    </span>
                    <button 
                      className="gdg-share-icon-btn" 
                      style={{ color: 'var(--gdg-error)' }} 
                      onClick={() => handleDeleteSponsor(s.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

      </div>
    </DashboardShell>
  );
}
