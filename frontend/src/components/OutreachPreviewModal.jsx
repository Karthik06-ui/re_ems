import React from 'react';
import { Mail, Users, Send, X } from 'lucide-react';

export default function OutreachPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  subject,
  body,
  audience,
  recipientCount,
  isSending = false
}) {
  if (!isOpen) return null;

  // Format audience string for display
  const getAudienceDisplay = (aud) => {
    switch (aud) {
      case 'all': return 'All Registered Chapter Members';
      case 'previous_participants': return 'Previous Event Attendees';
      case 'registrants': return 'Confirmed Event Registrants Only';
      case 'waitlist': return 'Waitlist Seating Queues';
      case 'Confirmed Attendees': return 'Confirmed Event Attendees';
      default: return aud || 'All Members';
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Mail size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={styles.title}>Confirm Outreach Dispatch</h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn} disabled={isSending}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.audienceCard}>
          <div style={styles.audienceRow}>
            <Users size={16} />
            <span style={{ fontWeight: 600 }}>Target Audience:</span>
            <span>{getAudienceDisplay(audience)}</span>
          </div>
          <div style={styles.recipientRow}>
            <span style={styles.recipientBadge}>
              {recipientCount} expected recipient(s)
            </span>
          </div>
        </div>

        <div style={styles.previewContainer}>
          <h4 style={styles.previewLabel}>Message Preview</h4>
          <div style={styles.previewBox}>
            <div style={styles.subjectRow}>
              <strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Subject:</strong>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{subject}</span>
            </div>
            <hr style={styles.divider} />
            <div style={{ fontSize: '13px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Body:</strong>
              <div style={styles.bodyContent}>{body}</div>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button 
            className="btn btn-secondary" 
            onClick={onClose} 
            disabled={isSending}
            style={{ minWidth: '80px' }}
          >
            Cancel
          </button>
          <button 
            className="btn btn-success" 
            onClick={onConfirm} 
            disabled={isSending || recipientCount === 0}
            style={{ minWidth: '130px', gap: '8px' }}
          >
            {isSending ? (
              <span>Sending...</span>
            ) : (
              <>
                <Send size={14} />
                <span>Confirm Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    width: '550px',
    maxWidth: '90%',
    padding: '24px',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    color: 'var(--text-primary)',
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  audienceCard: {
    backgroundColor: 'var(--primary-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  audienceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text-primary)',
  },
  recipientRow: {
    display: 'flex',
  },
  recipientBadge: {
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  previewLabel: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  previewBox: {
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    background: 'var(--input-bg)',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  subjectRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '8px',
  },
  divider: {
    border: 0,
    borderTop: '1px solid var(--border-color)',
    margin: '10px 0',
  },
  bodyContent: {
    whiteSpace: 'pre-wrap',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
    fontSize: '13.5px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px',
    marginTop: '4px',
  }
};
