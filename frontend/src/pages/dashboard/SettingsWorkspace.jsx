import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  Facebook, Instagram, Linkedin, Twitter, Link as LinkIcon, 
  MapPin, Image as ImageIcon, Trash2, Upload, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Heading, Undo, Redo, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function SettingsWorkspace() {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const { activeChapter, refreshChapters } = useChapter();

  // Settings form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationStr, setLocationStr] = useState('');
  
  // Social link fields
  const [fb, setFb] = useState('');
  const [ig, setIg] = useState('');
  const [li, setLi] = useState('');
  const [x, setX] = useState('');
  const [customLink, setCustomLink] = useState('');

  // Media
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeChapter) {
      setTitle(activeChapter.name || '');
      setDescription(activeChapter.description || '');
      setLocationStr(activeChapter.location || '');
      
      const socials = activeChapter.social_links || {};
      setFb(socials.facebook || '');
      setIg(socials.instagram || '');
      setLi(socials.linkedin || '');
      setX(socials.twitter || socials.x || '');
      setCustomLink(socials.custom || '');
      
      setLogoUrl(activeChapter.logo || 'https://www.gstatic.com/devrel-devsite/prod/v559d28dbd68e4de88d1d8ef35b54203a7a97c27632669e46a782e46e8557ee7a/developers/images/touchicon-180.png');
      setBannerUrl(activeChapter.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80');
    }
  }, [activeChapter]);

  const handleSave = async () => {
    if (!activeChapter) return;
    setSaving(true);

    const updatedSocials = {
      facebook: fb,
      instagram: ig,
      linkedin: li,
      x: x,
      custom: customLink
    };

    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.id}/`, 'PATCH', {
      name: title,
      description: description,
      location: locationStr,
      social_links: updatedSocials,
      logo: logoUrl,
      banner: bannerUrl
    }, true);

    if (status === 200) {
      alert('Chapter settings saved successfully!');
      refreshChapters();
    } else {
      alert(data.detail || 'Failed to save settings.');
    }
    setSaving(false);
  };

  const tabs = ['overview', 'media', 'team', 'payments', 'tracking', 'widgets'];

  return (
    <DashboardShell sectionTitle="Settings">
      
      {/* Tab navigation */}
      <div className="gdg-tabs-container">
        {tabs.map(t => (
          <button 
            key={t}
            className={`gdg-tab ${tab === t ? 'active' : ''}`}
            onClick={() => navigate(`/dashboard/settings/${t}`)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === 'overview' && (
        <div className="gdg-grid-2-1" style={{ position: 'relative', paddingBottom: '80px' }}>
          
          {/* Left Column (Main forms editor) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3>General Configuration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Title */}
                <div className="form-group">
                  <label>Title (required)</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    placeholder="Chapter title" 
                  />
                </div>

                {/* Location */}
                <div className="form-group">
                  <label>Location</label>
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

                {/* Description Rich Text Editor Mock */}
                <div className="form-group">
                  <label>Description</label>
                  <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '6px', overflow: 'hidden' }}>
                    {/* Rich text Editor Toolbar */}
                    <div style={{ background: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', padding: '6px 12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Undo"><Undo size={14} /></button>
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Redo"><Redo size={14} /></button>
                      <span style={{ borderLeft: '1px solid var(--gdg-border)', height: '18px' }} />
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px', fontWeight: 'bold' }} title="Bold"><Bold size={14} /></button>
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px', fontStyle: 'italic' }} title="Italic"><Italic size={14} /></button>
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Underline"><Underline size={14} /></button>
                      <span style={{ borderLeft: '1px solid var(--gdg-border)', height: '18px' }} />
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Align Left"><AlignLeft size={14} /></button>
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Align Center"><AlignCenter size={14} /></button>
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px' }} title="Align Right"><AlignRight size={14} /></button>
                      <span style={{ borderLeft: '1px solid var(--gdg-border)', height: '18px' }} />
                      <button type="button" className="gdg-share-icon-btn" style={{ width: '28px', height: '28px', display: 'flex', gap: '2px' }} title="Heading"><Heading size={14} /></button>
                    </div>
                    {/* Input box */}
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={6}
                      maxLength={10000}
                      style={{ width: '100%', border: 'none', outline: 'none', padding: '12px', boxSizing: 'border-box', resize: 'vertical', background: '#FFF', color: 'var(--gdg-text-primary)', fontFamily: 'inherit' }}
                      placeholder="Welcome to our GDG Chapter workspace..."
                    />
                  </div>
                  <span style={{ alignSelf: 'flex-end', fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>
                    {description.length} / 10000
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column (Sidebar inputs & Media upload mock) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Media thumbnails (2 tiles) */}
            <div className="card">
              <h3>Media Assets</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Tile 1: Banner Image */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gdg-text-secondary)', display: 'block', marginBottom: '6px' }}>Cover Banner</label>
                  <div style={{ 
                    position: 'relative', 
                    borderRadius: '6px', 
                    border: '1px solid var(--gdg-border)',
                    height: '110px', 
                    overflow: 'hidden',
                    background: '#F1F3F4' 
                  }}>
                    <img 
                      src={bannerUrl} 
                      alt="Banner Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: 'rgba(0,0,0,0.4)', 
                      opacity: 0, 
                      transition: 'opacity 0.2s', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '12px',
                      color: '#FFF'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <button type="button" className="gdg-share-icon-btn" onClick={() => setBannerUrl('')} style={{ color: '#FFF', background: 'none' }} title="Delete Banner"><Trash2 size={16} /></button>
                      <button type="button" className="gdg-share-icon-btn" onClick={() => {
                        const url = prompt('Enter Image URL:');
                        if (url) setBannerUrl(url);
                      }} style={{ color: '#FFF', background: 'none' }} title="Upload Banner"><Upload size={16} /></button>
                    </div>
                  </div>
                </div>

                {/* Tile 2: Logo Image */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gdg-text-secondary)', display: 'block', marginBottom: '6px' }}>Chapter Logo</label>
                  <div style={{ 
                    position: 'relative', 
                    borderRadius: '6px', 
                    border: '1px solid var(--gdg-border)',
                    width: '72px',
                    height: '72px', 
                    overflow: 'hidden',
                    background: '#F1F3F4' 
                  }}>
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: 'rgba(0,0,0,0.4)', 
                      opacity: 0, 
                      transition: 'opacity 0.2s', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: '#FFF'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <button type="button" className="gdg-share-icon-btn" onClick={() => {
                        const url = prompt('Enter Logo URL:');
                        if (url) setLogoUrl(url);
                      }} style={{ color: '#FFF', background: 'none' }} title="Upload Logo"><Upload size={16} /></button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Socials section */}
            <div className="card">
              <h3>Social Networks</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Facebook */}
                <div className="form-group">
                  <label>Facebook URL</label>
                  <div style={{ position: 'relative' }}>
                    <Facebook size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
                    <input 
                      type="url" 
                      value={fb} 
                      onChange={e => setFb(e.target.value)} 
                      style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                      placeholder="https://facebook.com/chapter" 
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div className="form-group">
                  <label>Instagram Handle</label>
                  <div style={{ position: 'relative' }}>
                    <Instagram size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
                    <input 
                      type="text" 
                      value={ig} 
                      onChange={e => setIg(e.target.value)} 
                      style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                      placeholder="instagram_handle" 
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <div style={{ position: 'relative' }}>
                    <Linkedin size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
                    <input 
                      type="url" 
                      value={li} 
                      onChange={e => setLi(e.target.value)} 
                      style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                      placeholder="https://linkedin.com/company/chapter" 
                    />
                  </div>
                </div>

                {/* X */}
                <div className="form-group">
                  <label>X / Twitter Handle</label>
                  <div style={{ position: 'relative' }}>
                    <Twitter size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
                    <input 
                      type="text" 
                      value={x} 
                      onChange={e => setX(e.target.value)} 
                      style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                      placeholder="@handle" 
                    />
                  </div>
                </div>

                {/* Custom Link */}
                <div className="form-group">
                  <label>Custom Website</label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
                    <input 
                      type="url" 
                      value={customLink} 
                      onChange={e => setCustomLink(e.target.value)} 
                      style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                      placeholder="https://chapter-portal.dev" 
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* STICKY SAVE BUTTON */}
          <button 
            type="button" 
            className="gdg-sticky-save" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? 'Saving Workspace...' : 'Save Settings'}
          </button>

        </div>
      )}

      {/* OTHER SETTINGS TABS */}
      {tab !== 'overview' && (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <ShieldAlert size={40} className="text-gray-300" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ textTransform: 'capitalize' }}>{tab} Configuration Workspace</h3>
          <p style={{ color: 'var(--gdg-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            Enter configuration metrics for your chapter's {tab} integrations. Edit domain tracking coordinates, widgets scripts, or payments credentials.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={handleSave}>
            Save {tab} Configuration
          </button>
        </div>
      )}

    </DashboardShell>
  );
}
