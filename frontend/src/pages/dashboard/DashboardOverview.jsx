import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  Mail, 
  Users, 
  Settings, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Send, 
  Copy, 
  Calendar, 
  Plus, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const carouselDots = Array(7).fill(null);

  return (
    <DashboardShell sectionTitle="Home">
      <div className="gdg-grid-2-1">
        {/* Left Column (Main Overview content) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* AI Suggested Event Card Section */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Events</h3>
              <Link to="/dashboard/events" className="blue-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                <Plus size={16} />
                <span>New event</span>
              </Link>
            </div>

            <div className="gdg-ai-card">
              <Calendar size={18} className="gdg-ai-badge" />
              <h4 className="gdg-ai-title">Women in Tech Meetup</h4>
              <p className="gdg-ai-description">
                Join our regional meetup focused on empowering women in engineering. Celebrate diversity, build collaborative pipelines, and discuss web speed performance, architectural models, and career roadmaps.
              </p>
              
              <button 
                onClick={() => {
                  navigate('/dashboard/events');
                  // Trigger event creation or prepopulate fields
                }} 
                className="gdg-ai-btn"
              >
                <span>⊕ Create</span>
              </button>

              <span className="gdg-ai-pill">AI Suggested</span>
            </div>

            {/* Carousel Navigation dots */}
            <div className="gdg-carousel-dots">
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => setActiveDot(prev => (prev === 0 ? 6 : prev - 1))}
              >
                <ChevronLeft size={16} className="text-gray-500 hover:text-gray-800" />
              </button>
              {carouselDots.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`carousel-dot ${activeDot === idx ? 'active' : ''}`}
                  onClick={() => setActiveDot(idx)}
                />
              ))}
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => setActiveDot(prev => (prev === 6 ? 0 : prev + 1))}
              >
                <ChevronRight size={16} className="text-gray-500 hover:text-gray-800" />
              </button>
            </div>
          </section>

          {/* Latest Discussions Section */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Latest discussions</h3>
              <a href="#new-discussion" className="blue-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                <Plus size={16} />
                <span>New discussion</span>
              </a>
            </div>

            <div className="gdg-discussion-card">
              <div className="gdg-discussion-avatar">AI</div>
              <div>
                <h4 className="gdg-discussion-title">
                  Why IEEE Matters: Exploring Impact and Opportunities in Electrical and Electronics Engineering
                </h4>
                <div className="gdg-discussion-meta">
                  <span>AI Generated · post created 2025-Jun-13</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Quick actions and Share options) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick actions panel */}
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 'bold', color: 'var(--gdg-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Quick Actions
            </h3>
            <div className="gdg-quick-row">
              <Link to="/dashboard/emails" className="gdg-quick-btn">
                <Mail className="gdg-quick-btn-icon" size={24} />
                <span className="gdg-quick-btn-label">Emails</span>
              </Link>
              <Link to="/dashboard/members" className="gdg-quick-btn">
                <Users className="gdg-quick-btn-icon" size={24} />
                <span className="gdg-quick-btn-label">Members</span>
              </Link>
              <Link to="/dashboard/settings/overview" className="gdg-quick-btn">
                <Settings className="gdg-quick-btn-icon" size={24} />
                <span className="gdg-quick-btn-label">Settings</span>
              </Link>
            </div>
          </div>

          {/* Share Section */}
          <div className="gdg-share-card">
            <div className="gdg-share-label">Share Chapter</div>
            <div className="gdg-share-row">
              <button className="gdg-share-icon-btn" title="Facebook"><Facebook size={18} /></button>
              <button className="gdg-share-icon-btn" title="LinkedIn"><Linkedin size={18} /></button>
              <button className="gdg-share-icon-btn" title="X / Twitter"><Twitter size={18} /></button>
              <button className="gdg-share-icon-btn" title="Email"><Send size={18} /></button>
              <button 
                className="gdg-share-icon-btn" 
                title={copied ? "Copied!" : "Copy Link"}
                onClick={handleCopyLink}
                style={copied ? { borderColor: 'var(--gdg-success)', color: 'var(--gdg-success)' } : {}}
              >
                <Copy size={18} />
              </button>
            </div>
            {copied && <p style={{ fontSize: '11px', color: 'var(--gdg-success)', marginTop: '8px', marginBottom: 0 }}>Link copied to clipboard!</p>}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
