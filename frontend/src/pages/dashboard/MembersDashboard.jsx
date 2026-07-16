import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { DashboardCard, StatusBadge, FilterPill } from '../../components/DashboardComponents';
import { Search, ShieldAlert, RefreshCw, BookOpen, Clock, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


export default function MembersDashboard() {
  const { apiRequest } = useAuth();


  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Member for Profile Drawer
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    const { status, data } = await apiRequest('/api/v1/auth/users/', 'GET', null, true);
    if (status === 200) {
      const formatted = data.map(item => ({
        id: item.id,
        name: item.user.name || item.user.email,
        email: item.user.email,
        status: 'Active',
        registrationsCount: item.user.registrations_count || 0,
        checkinsCount: item.user.checkins_count || 0,
        eventHistory: item.user.event_history || []
      }));
      setMembers(formatted);
      if (selectedMember) {
        const updatedSelected = formatted.find(f => f.id === selectedMember.id);
        setSelectedMember(updatedSelected || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filtered = members.filter(m => {
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardShell sectionTitle="Members">
      <div className="gdg-grid-2-1">
        
        {/* Left Column (Directory list) */}
        <DashboardCard title="Chapter Members Directory">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '6px 12px 6px 30px', borderRadius: '4px', border: '1px solid var(--gdg-border)', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

          </div>

          {loading ? (
            <div className="gdg-spinner-container"><div className="gdg-spinner"></div></div>
          ) : (
            <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', fontWeight: 'bold', color: 'var(--gdg-text-secondary)' }}>
                    <th style={{ padding: '10px 16px' }}>NAME / EMAIL</th>
                    <th style={{ padding: '10px 16px' }}>REGISTRATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr 
                      key={m.id} 
                      style={{ borderBottom: '1px solid var(--gdg-border)', cursor: 'pointer', background: selectedMember?.id === m.id ? '#E8F0FE' : '#FFF' }}
                      onClick={() => setSelectedMember(m)}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 500, display: 'block' }}>{m.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>{m.email}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '12px' }}>{m.registrationsCount} events</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Right Column (Participation profiles) */}
          <DashboardCard title="Member Workspace Profile Overview">
            {selectedMember ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>{selectedMember.name}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>{selectedMember.email}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--gdg-border)', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--gdg-text-secondary)', textTransform: 'uppercase' }}>Participation metrics</h4>
                  <div className="gdg-stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="stat-card" style={{ padding: '10px', background: '#F8F9FA', border: '1px solid var(--gdg-border)', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--gdg-text-secondary)' }}>REGISTRATIONS</span>
                      <h5 style={{ margin: '4px 0 0 0', fontSize: '20px', color: 'var(--gdg-blue)' }}>{selectedMember.registrationsCount}</h5>
                    </div>
                    <div className="stat-card" style={{ padding: '10px', background: '#F8F9FA', border: '1px solid var(--gdg-border)', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--gdg-text-secondary)' }}>CHECK-INS</span>
                      <h5 style={{ margin: '4px 0 0 0', fontSize: '20px', color: 'var(--gdg-blue)' }}>{selectedMember.checkinsCount}</h5>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gdg-border)', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--gdg-text-secondary)', textTransform: 'uppercase' }}>Event History Logs</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedMember.eventHistory && selectedMember.eventHistory.length > 0 ? (
                      selectedMember.eventHistory.map((hist, index) => (
                        <div key={index} style={{ padding: '8px', border: '1px solid var(--gdg-border)', borderRadius: '6px', fontSize: '12px', background: '#F8F9FA' }}>
                          <strong>{hist.event_title}</strong>
                          <p style={{ margin: '2px 0 0 0', color: 'var(--gdg-text-secondary)' }}>{hist.status}</p>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontStyle: 'italic', color: 'var(--gdg-text-secondary)', fontSize: '12px', margin: 0 }}>No registration history found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', color: 'var(--gdg-text-secondary)', textAlign: 'center', fontSize: '13px' }}>
                Select a member from the directory to review event histories.
              </p>
            )}
          </DashboardCard>
        </div>

      </div>
    </DashboardShell>
  );
}
