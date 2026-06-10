import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  Facebook, Instagram, Linkedin, Twitter, Link as LinkIcon, 
  MapPin, Image as ImageIcon, Trash2, Upload, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Heading, Undo, Redo, ShieldAlert, Users, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';
import { DashboardCard } from '../../components/DashboardComponents';

export default function SettingsWorkspace() {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const { activeChapter, refreshChapters } = useChapter();

  // Overview Tab Form States
  const [title, setTitle] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [description, setDescription] = useState('');

  // Branding Tab States
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#1A73E8');

  // Team Tab States
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [newTeamRole, setNewTeamRole] = useState('Organizer');

  // Tracking Tab States
  const [gaTrackingId, setGaTrackingId] = useState('G-XXXXXXXXXX');

  const [saving, setSaving] = useState(false);

  const fetchTeamMembers = async () => {
    if (!activeChapter) return;
    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/roles/`, 'GET', null, true);
    if (status === 200) {
      setTeamMembers(data.map(item => ({
        id: item.id,
        name: item.user.name || item.user.email,
        email: item.user.email,
        role: item.role === 'chapter_lead' ? 'Chapter Lead' : item.role === 'organizer' ? 'Organizer' : 'Member',
        canPublish: item.role !== 'member',
        canEmail: item.role !== 'member'
      })));
    }
  };

  useEffect(() => {
    if (activeChapter) {
      setTitle(activeChapter.name || '');
      setLocationStr(activeChapter.location || '');
      setDescription(activeChapter.description || '');
      setLogoUrl(activeChapter.logo || 'https://www.gstatic.com/devrel-devsite/prod/v559d28dbd68e4de88d1d8ef35b54203a7a97c27632669e46a782e46e8557ee7a/developers/images/touchicon-180.png');
      setBannerUrl(activeChapter.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80');
    }
  }, [activeChapter]);

  useEffect(() => {
    if (activeChapter && tab === 'team') {
      fetchTeamMembers();
    }
  }, [activeChapter, tab]);

  const handleSaveSettings = async () => {
    if (!activeChapter) return;
    setSaving(true);

    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/`, 'PATCH', {
      name: title,
      location: locationStr,
      description: description,
      logo: logoUrl,
      banner: bannerUrl
    }, true);

    if (status === 200) {
      alert('Chapter configurations successfully saved!');
      refreshChapters();
    } else {
      alert(data.detail || 'Failed to save configurations.');
    }
    setSaving(false);
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newTeamEmail) return;
    const backendRole = newTeamRole === 'Chapter Lead' ? 'chapter_lead' : 'organizer';

    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/roles/`, 'POST', {
      user_email: newTeamEmail,
      role: backendRole
    }, true);

    if (status === 201 || status === 200) {
      setNewTeamEmail('');
      fetchTeamMembers();
    } else {
      alert(data.user_email ? data.user_email[0] : 'Failed to invite team member. Please verify user email is registered.');
    }
  };

  const handleRemoveTeamMember = async (roleId) => {
    if (!window.confirm("Remove this team member role?")) return;
    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/roles/`, 'DELETE', {
      role_id: roleId
    }, true);

    if (status === 204 || status === 200) {
      fetchTeamMembers();
    } else {
      alert(data?.detail || 'Failed to remove team member.');
    }
  };

  const settingsTabs = ['overview', 'branding', 'team', 'tracking'];

  return (
    <DashboardShell sectionTitle="Settings">
      
      {/* Tab navigations */}
      <div className="gdg-tabs-container">
        {settingsTabs.map(t => (
          <button 
            key={t}
            className={`gdg-tab ${tab === t ? 'active' : ''}`}
            onClick={() => navigate(`/dashboard/settings/${t}`)}
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="gdg-grid-2-1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <DashboardCard title="Chapter Details Configuration">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Name */}
                  <div className="form-group">
                    <label>Chapter Name</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>

                  {/* Location */}
                  <div className="form-group">
                    <label>Location Coordinates</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--gdg-text-secondary)' }} />
                      <input 
                        type="text" 
                        value={locationStr} 
                        onChange={e => setLocationStr(e.target.value)} 
                        style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                        placeholder="Coimbatore, Tamil Nadu, India" 
                      />
                    </div>
                  </div>

                  {/* Description Rich text editor mock */}
                  <div className="form-group">
                    <label>Description Details</label>
                    <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ background: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', padding: '6px 12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Undo"><Undo size={14} /></button>
                        <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Redo"><Redo size={14} /></button>
                        <span style={{ borderLeft: '1px solid var(--gdg-border)', height: '18px' }} />
                        <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px', fontWeight: 'bold' }} title="Bold"><Bold size={14} /></button>
                        <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px', fontStyle: 'italic' }} title="Italic"><Italic size={14} /></button>
                        <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Underline"><Underline size={14} /></button>
                      </div>
                      <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={6}
                        maxLength={10000}
                        style={{ width: '100%', border: 'none', outline: 'none', padding: '12px', boxSizing: 'border-box', background: '#FFF', color: 'var(--gdg-text-primary)' }}
                      />
                    </div>
                    <span style={{ alignSelf: 'flex-end', fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>
                      {description.length} / 10000
                    </span>
                  </div>

                </div>
              </DashboardCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <DashboardCard title="Active parameters status">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--gdg-success)' }} />
                  <strong>Active GDG Chapter</strong>
                </div>
                <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--gdg-text-secondary)', lineHeight: 1.5 }}>
                  This chapter is actively synced with global Google Developers Group telemetry.
                </p>
              </DashboardCard>
            </div>
          </div>
        )}

        {/* BRANDING TAB */}
        {tab === 'branding' && (
          <div className="gdg-grid-2-1">
            <DashboardCard title="Visual Branding Customizer">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Banner */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Chapter Cover Banner</label>
                  <div style={{ position: 'relative', height: '140px', background: '#F1F3F4', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gdg-border)' }}>
                    <img src={bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                      <button className="gdg-share-icon-btn" onClick={() => setBannerUrl('')} style={{ background: '#FFF' }}><Trash2 size={14} /></button>
                      <button className="gdg-share-icon-btn" onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url) setBannerUrl(url);
                      }} style={{ background: '#FFF' }}><Upload size={14} /></button>
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Chapter Logo/Avatar</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gdg-border)', background: '#F1F3F4' }}>
                      <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <button className="btn btn-secondary" onClick={() => {
                      const url = prompt('Enter Logo URL:');
                      if (url) setLogoUrl(url);
                    }}>
                      <Upload size={14} />
                      <span>Upload New Logo</span>
                    </button>
                  </div>
                </div>

                {/* Color Scheme */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Primary Theme Color</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={themeColor} 
                      onChange={e => setThemeColor(e.target.value)} 
                      style={{ border: 'none', width: '40px', height: '40px', padding: 0, cursor: 'pointer', background: 'none' }}
                    />
                    <input 
                      type="text" 
                      value={themeColor} 
                      onChange={e => setThemeColor(e.target.value)} 
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--gdg-border)', fontSize: '14px', width: '100px' }}
                    />
                  </div>
                </div>

              </div>
            </DashboardCard>
          </div>
        )}

        {/* TEAM TAB */}
        {tab === 'team' && (
          <div className="gdg-grid-2-1">
            <DashboardCard title="Team Members Permissions Dashboard">
              <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', fontWeight: 'bold', color: 'var(--gdg-text-secondary)' }}>
                      <th style={{ padding: '10px 16px' }}>MEMBER DETAILS</th>
                      <th style={{ padding: '10px 16px' }}>PUBLISH EVENTS</th>
                      <th style={{ padding: '10px 16px' }}>SEND CAMPAIGNS</th>
                      <th style={{ padding: '10px 16px' }}>REMOVE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--gdg-border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ display: 'block' }}>{m.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>{m.email} | {m.role}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={m.canPublish} 
                            onChange={() => togglePermission(m.id, 'canPublish')} 
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={m.canEmail} 
                            onChange={() => togglePermission(m.id, 'canEmail')} 
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button className="gdg-share-icon-btn" style={{ color: 'var(--gdg-error)' }} onClick={() => handleRemoveTeamMember(m.id)}><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardCard>

            <DashboardCard title="Add Team Member">
              <form onSubmit={handleAddTeamMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={newTeamEmail} onChange={e => setNewTeamEmail(e.target.value)} required placeholder="user@gmail.com" />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={newTeamRole} onChange={e => setNewTeamRole(e.target.value)}>
                    <option value="Organizer">Organizer</option>
                    <option value="Chapter Lead">Chapter Lead</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit">Invite Member</button>
              </form>
            </DashboardCard>
          </div>
        )}

        {/* TRACKING TAB */}
        {tab === 'tracking' && (
          <DashboardCard title="Analytics Tracking Configuration" className="max-w-xl">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Google Analytics Measurement ID</label>
                <input 
                  type="text" 
                  value={gaTrackingId} 
                  onChange={e => setGaTrackingId(e.target.value)} 
                  placeholder="G-XXXXXXXXXX" 
                  style={{ width: '100%' }} 
                />
                <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>
                  Configures the GA tracker to trace page impressions and registrations Milestones clicks.
                </span>
              </div>
              
              <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Tracking ID saved!')}>
                Save Tracking Config
              </button>
            </div>
          </DashboardCard>
        )}

      </div>

      {/* STICKY SAVE TRIGGER PANEL */}
      <button 
        type="button" 
        className="gdg-sticky-save" 
        onClick={handleSaveSettings} 
        disabled={saving}
      >
        {saving ? 'Saving Configurations...' : 'Save Settings'}
      </button>

    </DashboardShell>
  );
}
