import React from 'react';
import DashboardShell from './DashboardShell';
import { HelpCircle, ExternalLink, ShieldCheck, Mail, Calendar } from 'lucide-react';

export default function HelpDashboard() {
  return (
    <DashboardShell sectionTitle="Help">
      <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Intro */}
        <div className="card">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <HelpCircle size={36} className="text-blue-500" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>GDG Chapter Organizer Help Center</h3>
              <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                Welcome to the GDG Dashboard workspace help resources. This platform manages regional chapter details, schedules developer summits, drafts newsletters/email campaigns, and captures attendance telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <div className="card">
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="text-gray-500" />
              How do I publish events?
            </h4>
            <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Navigate to the calendar <strong>Events</strong> tab, click <strong>New event</strong>, and create a draft. Once details (venue, timing, capacity) are complete, transition the status drop-down select option to <strong>Published</strong> to reveal it on public listings.
            </p>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} className="text-gray-500" />
              How are waitlists handled?
            </h4>
            <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              If event registrations reach capacity, new RSVPs automatically join the waitlist queue. If a confirmed guest cancels their ticket, the system automatically promotes the next waitlisted registrant (FIFO order).
            </p>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} className="text-gray-500" />
              Email Dispatch Rules
            </h4>
            <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Organizers can compose updates and target chapter members, confirmed attendees, or waitlisted users. Verify all information carefully before clicking <strong>Dispatch</strong> as messages transmit immediately.
            </p>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} className="text-gray-500" />
              Need help?
            </h4>
            <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              For developer program updates, badge applications, or platform bugs, contact program coordinators or join the global developer groups community forum channels.
            </p>
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
