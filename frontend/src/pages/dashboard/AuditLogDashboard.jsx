import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardCard } from '../../components/DashboardComponents';
import { FileText, Search, Filter, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

export default function AuditLogDashboard() {
  const { apiRequest } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [entityType, setEntityType] = useState('');

  // Expanded row state
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = async (currentPage = 1) => {
    setLoading(true);
    try {
      let query = `?page=${currentPage}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (actionType) query += `&action_type=${actionType}`;
      if (entityType) query += `&entity_type=${entityType}`;

      const { status, data } = await apiRequest(`/api/v1/auth/audit-logs/${query}`, 'GET', null, true);
      
      if (status === 200) {
        setLogs(data.results);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / 20)); // Assuming page size 20
        setPage(currentPage);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch, debounce logic could be added for search
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, actionType, entityType]);

  const toggleExpand = (id) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return '#188038'; // Green
      case 'update': return '#1a73e8'; // Blue
      case 'delete': return '#d93025'; // Red
      case 'status_change': return '#e37400'; // Orange
      case 'login': return '#34a853';
      default: return '#6c757d'; // Gray
    }
  };

  return (
    <DashboardShell sectionTitle="System Audit Log">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-h)' }}>
            Administrative Audit Log
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Immutable record of all actions performed by committee members.
          </p>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: 'rgba(36, 134, 137, 0.1)', color: '#248689', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
          {totalCount} Total Entries
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by entity label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select 
            value={actionType} 
            onChange={(e) => setActionType(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="status_change">Status Change</option>
            <option value="send">Send</option>
            <option value="approve">Approve</option>
          </select>

          <select 
            value={entityType} 
            onChange={(e) => setEntityType(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
          >
            <option value="">All Entities</option>
            <option value="Event">Event</option>
            <option value="Sponsor">Sponsor</option>
            <option value="Registration">Registration</option>
            <option value="EmailCampaign">EmailCampaign</option>
            <option value="AdminProfile">AdminProfile</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(234, 67, 53, 0.1)', color: '#EA4335', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <DashboardCard title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> Recent Activity</span>}>
        <div style={{ overflowX: 'auto' }}>
          <table className="gdg-table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th>PROFILE (USER)</th>
                <th>ACTION</th>
                <th>ENTITY</th>
                <th>TARGET</th>
                <th>TIMESTAMP</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No audit logs found matching the criteria.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr style={{ backgroundColor: expandedId === log.id ? 'var(--input-bg)' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.admin_profile_name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.admin_user_email}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 600, 
                          color: getActionColor(log.action_type),
                          backgroundColor: `${getActionColor(log.action_type)}1A` 
                        }}>
                          {log.action_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 500 }}>
                        {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {log.entity_label || '-'}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <button 
                            onClick={() => toggleExpand(log.id)}
                            style={{ 
                              background: 'none', border: 'none', color: '#1a73e8', 
                              fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'
                            }}
                          >
                            {expandedId === log.id ? 'Hide' : 'View Changes'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && log.changes && Object.keys(log.changes).length > 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0' }}>
                          <div style={{ 
                            padding: '16px', 
                            backgroundColor: '#1E1E1E', 
                            color: '#D4D4D4',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            overflowX: 'auto'
                          }}>
                            <pre style={{ margin: 0 }}>
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                disabled={page === 1 || loading}
                onClick={() => fetchLogs(page - 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="btn btn-secondary" 
                disabled={page === totalPages || loading}
                onClick={() => fetchLogs(page + 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </DashboardCard>
    </DashboardShell>
  );
}
