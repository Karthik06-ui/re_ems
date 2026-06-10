import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { DashboardCard, StatusBadge, FilterPill } from '../../components/DashboardComponents';
import { Search, ShieldAlert, RefreshCw, BookOpen, Clock, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function MembersDashboard() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Selected Member for Profile Drawer
  const [selectedMember, setSelectedMember] = useState(null);

  // Invite states
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member');

  const fetchMembers = async () => {
    if (!activeChapter) return;
    setLoading(true);
    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/roles/`, 'GET', null, true);
    if (status === 200) {
      const formatted = data.map(item => ({
        id: item.id,
        name: item.user.name || item.user.email,
        email: item.user.email,
        role: item.role === 'chapter_lead' ? 'Chapter Lead' : item.role === 'organizer' ? 'Organizer' : 'Member',
        status: 'Active',
        registrationsCount: 0,
        checkinsCount: 0
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
  }, [activeChapter]);

  const handleRoleChange = async (memberEmail, newRoleDisplay) => {
    if (!activeChapter) return;
    const backendRole = newRoleDisplay === 'Chapter Lead' ? 'chapter_lead' : newRoleDisplay === 'Organizer' ? 'organizer' : 'member';
    
    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/roles/`, 'POST', {
      user_email: memberEmail,
      role: backendRole
    }, true);

    if (status === 201 || status === 200) {
      fetchMembers();
    } else {
      alert(data.user_email ? data.user_email[0] : 'Failed to update member role.');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/roles/`, 'POST', {
      user_email: newEmail,
      role: newRole
    }, true);

    if (status === 201 || status === 200) {
      setNewEmail('');
      fetchMembers();
    } else {
      alert(data.user_email ? data.user_email[0] : 'Failed to invite member. Please check if user email is registered.');
    }
  };

  const handleDeleteMemberRole = async (roleId) => {
    if (!window.confirm("Remove this member role assignment?")) return;
    const { status, data } = await apiRequest(`/api/v1/chapters/${activeChapter.slug}/roles/`, 'DELETE', {
      role_id: roleId
    }, true);

    if (status === 204 || status === 200) {
      fetchMembers();
    } else {
      alert(data?.detail || 'Failed to remove member role.');
    }
  };

  const filtered = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesSearch && matchesRole;
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
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              className="gdg-header-dropdown"
            >
              <option value="All">All Roles</option>
              <option value="Chapter Lead">Chapter Lead</option>
              <option value="Organizer">Organizer</option>
              <option value="Member">Member</option>
            </select>
          </div>

          {loading ? (
            <div className="gdg-spinner-container"><div className="gdg-spinner"></div></div>
          ) : (
            <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', fontWeight: 'bold', color: 'var(--gdg-text-secondary)' }}>
                    <th style={{ padding: '10px 16px' }}>NAME</th>
                    <th style={{ padding: '10px 16px' }}>CHAPTER ROLE</th>
                    <th style={{ padding: '10px 16px' }}>ROLE CONTROL</th>
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
                        <span className="role-tag" style={{ fontSize: '10px' }}>{m.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select 
                            value={m.role} 
                            onChange={e => handleRoleChange(m.email, e.target.value)}
                            style={{ fontSize: '12px', padding: '2px 4px', borderRadius: '4px' }}
                          >
                            <option value="Chapter Lead">Chapter Lead</option>
                            <option value="Organizer">Organizer</option>
                            <option value="Member">Member</option>
                          </select>
                          <button 
                            className="gdg-share-icon-btn" 
                            style={{ color: 'var(--gdg-error)', width: '24px', height: '24px', padding: 0 }}
                            onClick={() => handleDeleteMemberRole(m.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Invite Member */}
          <DashboardCard title="Invite New Chapter Member">
            <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  required 
                  placeholder="user@gmail.com" 
                />
              </div>
              <div className="form-group">
                <label>Assigned Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="organizer">Organizer</option>
                  <option value="chapter_lead">Chapter Lead</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Invite Member</button>
            </form>
          </DashboardCard>

          {/* Right Column (Participation profiles) */}
          <DashboardCard title="Member Workspace Profile Overview">
            {selectedMember ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>{selectedMember.name}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>{selectedMember.email}</span>
                  <div style={{ marginTop: '8px' }}>
                    <span className="role-tag">{selectedMember.role}</span>
                  </div>
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
                    <div style={{ padding: '8px', border: '1px solid var(--gdg-border)', borderRadius: '6px', fontSize: '12px', background: '#F8F9FA' }}>
                      <strong>Era of Infinite Software</strong>
                      <p style={{ margin: '2px 0 0 0', color: 'var(--gdg-text-secondary)' }}>Checked in at entrance</p>
                    </div>
                    <div style={{ padding: '8px', border: '1px solid var(--gdg-border)', borderRadius: '6px', fontSize: '12px', background: '#F8F9FA' }}>
                      <strong>Vite & Rollup workshop</strong>
                      <p style={{ margin: '2px 0 0 0', color: 'var(--gdg-text-secondary)' }}>Seat Confirmed</p>
                    </div>
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
