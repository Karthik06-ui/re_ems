import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Info, Calendar, Monitor, Users, CheckSquare, Edit, ExternalLink, 
  Copy, Trash, UserCheck, ArrowUpCircle, Bell, X, Send, Award, BookOpen
} from 'lucide-react';

// 1. DashboardCard
export function DashboardCard({ title, children, action, className = '' }) {
  return (
    <div className={`card ${className}`} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--gdg-border)', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// 2. StatCard
export function StatCard({ value, label, emoji, tooltip }) {
  return (
    <div className="gdg-stat-card">
      <h4 className="gdg-stat-number">{value}</h4>
      <span className="gdg-stat-label">
        {label} {emoji}
        {tooltip && <Info size={13} className="text-gray-400 cursor-pointer" title={tooltip} />}
      </span>
    </div>
  );
}

// 3. AnalyticsCard
export function AnalyticsCard({ title, children, height = '320px' }) {
  return (
    <DashboardCard title={title}>
      <div style={{ height, width: '100%' }}>
        {children}
      </div>
    </DashboardCard>
  );
}

// 4. FilterPill
export function FilterPill({ label, active, onClick, icon: Icon }) {
  return (
    <button 
      onClick={onClick}
      className={`gdg-filter-pill ${active ? 'active' : ''}`}
    >
      {Icon && <Icon size={12} />}
      <span>{label}</span>
    </button>
  );
}

// 5. StatusBadge
export function StatusBadge({ status, type = 'default' }) {
  const getBadgeClass = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'confirmed':
      case 'sent':
      case 'gold':
      case 'platinum':
        return 'gdg-badge-active';
      case 'pending':
      case 'draft':
      case 'silver':
        return 'gdg-badge-draft';
      case 'cancelled':
      case 'bronze':
      case 'archived':
        return 'gdg-badge-completed';
      default:
        return 'gdg-badge-completed';
    }
  };

  return (
    <span className={`gdg-badge ${getBadgeClass()}`}>
      {status}
    </span>
  );
}

// 6. EventStatusBadge (Lifecycle state machine)
export function EventStatusBadge({ status }) {
  const getColors = () => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return { bg: '#FEF7E0', text: '#B06000', dot: '#F9AB00' };
      case 'published':
        return { bg: '#E8F0FE', text: '#1A73E8', dot: '#1A73E8' };
      case 'registration open':
        return { bg: '#E6F4EA', text: '#137333', dot: '#34A853' };
      case 'registration closed':
        return { bg: '#FCE8E6', text: '#C5221F', dot: '#EA4335' };
      case 'completed':
        return { bg: '#F1F3F4', text: '#5F6368', dot: '#9AA0A6' };
      case 'archived':
        return { bg: '#F3E5F5', text: '#7B1FA2', dot: '#7C4DFF' };
      default:
        return { bg: '#F1F3F4', text: '#5F6368', dot: '#9AA0A6' };
    }
  };

  const colors = getColors();

  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '6px', 
      fontSize: '12px', 
      fontWeight: 500, 
      padding: '2px 8px', 
      borderRadius: '12px',
      backgroundColor: colors.bg,
      color: colors.text
    }}>
      <span className="gdg-dot" style={{ backgroundColor: colors.dot }} />
      {status}
    </span>
  );
}

// 7. EventCard
export function EventCard({ event, onEdit, onView, onDuplicate, onDelete, onTransition }) {
  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'draft': return '#F9AB00';
      case 'published': return '#1A73E8';
      case 'registration open': return '#34A853';
      case 'registration closed': return '#EA4335';
      case 'completed': return '#9AA0A6';
      case 'archived': return '#7C4DFF';
      default: return '#9AA0A6';
    }
  };

  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', padding: '20px', minHeight: '180px', boxSizing: 'border-box', backgroundColor: '#FFFFFF', border: '1px solid var(--gdg-border)', borderRadius: '8px' }}>
      
      {/* Left Details */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 600 }}>{event.title}</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--gdg-text-secondary)', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              {new Date(event.start_time).toLocaleString()}
            </span>
            <span>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Monitor size={14} />
              {(event.category || 'workshop').toUpperCase()} • {event.type.toUpperCase()}
            </span>
            <span>|</span>
            <EventStatusBadge status={event.status} />
            <span>|</span>
            <span>📋 Capacity: {event.registration_count}/{event.capacity}</span>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--gdg-text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} />
              Registrations: {event.registration_count}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckSquare size={14} />
              Check-ins: {event.registration_count > 0 ? Math.floor(event.registration_count * 0.7) : 0}
            </span>
          </div>
        </div>

        {/* Transition Lifecycle Controls */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--gdg-text-secondary)' }}>LIFECYCLE STATE:</span>
          {onTransition && (
            <select 
              value={event.status} 
              onChange={(e) => onTransition(event.id, e.target.value)}
              style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--gdg-border)' }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="registration open">Registration Open</option>
              <option value="registration closed">Registration Closed</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </div>

        {/* Actions Row */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          {onEdit && (
            <button onClick={() => onEdit(event.id)} className="blue-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <Edit size={14} />
              <span>Workspace</span>
            </button>
          )}
          {onView && (
            <button onClick={() => onView(event.id)} className="blue-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <ExternalLink size={14} />
              <span>Event Page</span>
            </button>
          )}
          {onDuplicate && (
            <button onClick={() => onDuplicate(event.id)} className="blue-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <span>Duplicate</span>
            </button>
          )}
          <button 
            className="blue-link" 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
              alert('URL copied!');
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
          >
            <Copy size={14} />
            <span>Copy URL</span>
          </button>
          
          {event.status.toLowerCase() === 'draft' && onDelete && (
            <button 
              onClick={() => onDelete(event.id)} 
              style={{ background: 'none', border: 'none', color: 'var(--gdg-error)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }}
            >
              <Trash size={14} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Thumbnail fixed ~180x180 */}
      <div style={{ 
        width: '180px', 
        height: '180px', 
        backgroundColor: '#1a1a2e', 
        backgroundImage: event.cover_image ? `url(${event.cover_image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#FFF',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!event.cover_image && (
          <>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
              <span className="logo-red" style={{ fontSize: '20px' }}>●</span>
              <span className="logo-blue" style={{ fontSize: '20px' }}>●</span>
              <span className="logo-yellow" style={{ fontSize: '20px' }}>●</span>
              <span className="logo-green" style={{ fontSize: '20px' }}>●</span>
            </div>
            <span style={{ fontSize: '11px', color: '#8b8ba0', fontWeight: 'bold' }}>GDG Chapter Event</span>
          </>
        )}
      </div>

    </div>
  );
}

// 8. RegistrationTable
export function RegistrationTable({ registrations, onCheckin, onBulkCheckin, onExport }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        {onBulkCheckin && (
          <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={onBulkCheckin}>
            Bulk Check-In All
          </button>
        )}
        {onExport && (
          <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={onExport}>
            Export to CSV
          </button>
        )}
      </div>

      <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', fontWeight: 'bold', color: 'var(--gdg-text-secondary)' }}>
              <th style={{ padding: '10px 16px' }}>ATTENDEE EMAIL</th>
              <th style={{ padding: '10px 16px' }}>TICKET TYPE</th>
              <th style={{ padding: '10px 16px' }}>REGISTRATION TIME</th>
              <th style={{ padding: '10px 16px' }}>STATUS</th>
              <th style={{ padding: '10px 16px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map(r => (
              <tr key={r.email} style={{ borderBottom: '1px solid var(--gdg-border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{r.email}</td>
                <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{r.ticket_type || 'General Admission'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--gdg-text-secondary)' }}>{r.date || '2026-Jun-09'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`gdg-badge ${r.status === 'checked_in' ? 'gdg-badge-active' : 'gdg-badge-draft'}`}>
                    {r.status === 'checked_in' ? 'Checked In' : 'Confirmed'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {r.status !== 'checked_in' && onCheckin && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => onCheckin(r.email)}
                    >
                      <UserCheck size={12} />
                      <span>Check-In</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 9. WaitlistTable
export function WaitlistTable({ waitlist, onPromote }) {
  return (
    <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', fontWeight: 'bold', color: 'var(--gdg-text-secondary)' }}>
            <th style={{ padding: '10px 16px' }}>POSITION</th>
            <th style={{ padding: '10px 16px' }}>ATTENDEE EMAIL</th>
            <th style={{ padding: '10px 16px' }}>QUEUE DATE</th>
            <th style={{ padding: '10px 16px' }}>FIFO INDICATOR</th>
            <th style={{ padding: '10px 16px' }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {waitlist.map((w, idx) => (
            <tr key={w.email} style={{ borderBottom: '1px solid var(--gdg-border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--gdg-blue)' }}>#{w.position || idx + 1}</td>
              <td style={{ padding: '12px 16px' }}>{w.email}</td>
              <td style={{ padding: '12px 16px', color: 'var(--gdg-text-secondary)' }}>{w.date || '2026-Jun-10'}</td>
              <td style={{ padding: '12px 16px' }}>
                {w.position === 1 ? (
                  <span style={{ color: 'var(--gdg-success)', fontWeight: 'bold', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    🟢 NEXT IN LINE (FIFO)
                  </span>
                ) : (
                  <span style={{ color: 'var(--gdg-text-secondary)', fontSize: '11px' }}>Queued</span>
                )}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {onPromote && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => onPromote(w.email)}
                  >
                    <ArrowUpCircle size={12} />
                    <span>Promote Seat</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 10. ActivityFeed
export function ActivityFeed({ activities }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {activities.map(act => (
        <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid var(--gdg-border)', paddingBottom: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--gdg-blue)' }}></div>
          <div style={{ fontSize: '13px' }}>
            <span style={{ color: 'var(--gdg-text-primary)', fontWeight: 500 }}>{act.content}</span>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>{act.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// 11. NotificationDrawer
export function NotificationDrawer({ isOpen, onClose, notifications, onMarkAsRead }) {
  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      width: '320px', 
      height: '100vh', 
      backgroundColor: '#FFFFFF', 
      boxShadow: '-4px 0 10px rgba(0,0,0,0.1)', 
      zIndex: 1000, 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'var(--gdg-font)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--gdg-border)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} className="text-blue-500" />
          <span>Chapter Alerts</span>
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--gdg-text-secondary)', textAlign: 'center', fontSize: '13px' }}>No new alerts.</p>
        ) : null}
        {notifications.map(n => (
          <div 
            key={n.id} 
            onClick={() => onMarkAsRead(n.id)}
            style={{ 
              border: '1px solid var(--gdg-border)', 
              borderRadius: '6px', 
              padding: '12px', 
              background: n.unread ? '#E8F0FE' : '#FFF',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background 0.2s'
            }}
          >
            <strong style={{ display: 'block', fontSize: '11px', color: 'var(--gdg-blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
              {n.type.replace('_', ' ')}
            </strong>
            <span style={{ color: 'var(--gdg-text-primary)' }}>{n.message}</span>
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--gdg-text-secondary)', marginTop: '6px' }}>{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 12. QuickActionCard
export function QuickActionCard({ actions }) {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {actions.map(act => {
        const Icon = act.icon;
        return (
          <button 
            key={act.label} 
            onClick={act.onClick}
            className="gdg-quick-btn"
            style={{ flex: '1 1 120px', minWidth: '100px' }}
          >
            <Icon size={20} className="gdg-quick-btn-icon" />
            <span className="gdg-quick-btn-label">{act.label}</span>
          </button>
        );
      })}
    </div>
  );
}
