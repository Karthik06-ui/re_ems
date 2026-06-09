import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { Users, Search, RefreshCw, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function MembersDashboard() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();

  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!activeChapter) return;
    setLoading(true);
    // Since member listings might not be directly exposed in CRUD endpoints or are scoped,
    // we mock a set of members or pull analytics overview active users
    const mockMembers = [
      { id: 1, name: 'Karthik S', email: 'karthik@gdgdemo.org', role: 'Chapter Lead', status: 'Active' },
      { id: 2, name: 'Deepika Kumar', email: 'deepika.k@college.edu', role: 'Organizer', status: 'Active' },
      { id: 3, name: 'Suresh Raina', email: 'suresh.r@cricket.org', role: 'Member', status: 'Active' },
      { id: 4, name: 'Jane Doe', email: 'jane.doe@gmail.com', role: 'Member', status: 'Pending' },
      { id: 5, name: 'Rahul Dravid', email: 'rahul.d@wall.com', role: 'Organizer', status: 'Active' }
    ];

    setTimeout(() => {
      setMembers(mockMembers);
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    fetchMembers();
  }, [activeChapter]);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell sectionTitle="Members">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0 }}>Chapter Members List</h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
              <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '6px 12px 6px 30px', borderRadius: '4px', border: '1px solid var(--gdg-border)', fontSize: '13px', width: '220px' }}
              />
            </div>
            <button className="gdg-share-icon-btn" onClick={fetchMembers} title="Refresh"><RefreshCw size={14} /></button>
          </div>
        </div>

        {loading ? (
          <div className="gdg-spinner-container">
            <div className="gdg-spinner"></div>
            <span>Loading chapter members directory...</span>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--gdg-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F3F4', borderBottom: '1px solid var(--gdg-border)', fontSize: '12px', fontWeight: 'bold', color: 'var(--gdg-text-secondary)' }}>
                  <th style={{ padding: '12px 16px' }}>NAME</th>
                  <th style={{ padding: '12px 16px' }}>EMAIL ADDRESS</th>
                  <th style={{ padding: '12px 16px' }}>CHAPTER ROLE</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--gdg-border)', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--gdg-text-secondary)' }}>{m.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="role-tag" style={{ 
                        backgroundColor: m.role === 'Chapter Lead' ? '#E8F0FE' : m.role === 'Organizer' ? '#FEF7E0' : '#F1F3F4',
                        color: m.role === 'Chapter Lead' ? 'var(--gdg-blue)' : m.role === 'Organizer' ? '#B06000' : 'var(--gdg-text-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {m.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`gdg-badge ${m.status === 'Active' ? 'gdg-badge-active' : 'gdg-badge-draft'}`}>
                        <span className={`gdg-dot ${m.status === 'Active' ? 'gdg-dot-active' : 'gdg-dot-draft'}`} />
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
