import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { 
  RegistrationTable, 
  DashboardCard, 
  FilterPill 
} from '../../components/DashboardComponents';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChapter } from '../../contexts/ChapterContext';

export default function RegistrationsDashboard() {
  const { apiRequest } = useAuth();
  const { activeChapter } = useChapter();

  const [registrations, setRegistrations] = useState([
    { email: 'karthik@gdgdemo.org', eventTitle: 'Era of Infinite Software', ticket_type: 'General Admission', date: '2026-Jun-09', status: 'confirmed' },
    { email: 'guest.user@college.edu', eventTitle: 'Vite & Rollup workshop', ticket_type: 'General Admission', date: '2026-Jun-09', status: 'checked_in' },
    { email: 'developer.lead@kumaraguru.edu', eventTitle: 'Era of Infinite Software', ticket_type: 'VIP Pass', date: '2026-Jun-10', status: 'confirmed' },
    { email: 'sponsor.rep@vercel.com', eventTitle: 'React Summit', ticket_type: 'VIP Pass', date: '2026-Jun-10', status: 'checked_in' }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchRegistrations = async () => {
    setLoading(true);
    // Mimic API sync
    setTimeout(() => setLoading(false), 300);
  };

  useEffect(() => {
    fetchRegistrations();
  }, [activeChapter]);

  const handleCheckin = (email) => {
    setRegistrations(prev => prev.map(r => r.email === email ? { ...r, status: 'checked_in' } : r));
    alert(`Attendee successfully checked in: ${email}`);
  };

  const handleBulkCheckin = () => {
    setRegistrations(prev => prev.map(r => ({ ...r, status: 'checked_in' })));
    alert('All listed attendees checked in successfully!');
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["EMAIL,EVENT,TICKET TYPE,STATUS"].join(",") + "\n"
      + registrations.map(r => `${r.email},${r.eventTitle},${r.ticket_type},${r.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "centralized_registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = registrations.filter(r => {
    const matchesSearch = r.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.eventTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = eventFilter === 'All' || r.eventTitle === eventFilter;
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'Checked In' && r.status === 'checked_in') ||
                         (statusFilter === 'Confirmed' && r.status === 'confirmed');
    return matchesSearch && matchesEvent && matchesStatus;
  });

  return (
    <DashboardShell sectionTitle="Registrations">
      
      {/* Search & filters toolbar */}
      <div className="gdg-filters-bar">
        <div className="gdg-filter-group">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gdg-text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by registrant email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '6px 12px 6px 30px', borderRadius: '4px', border: '1px solid var(--gdg-border)', fontSize: '13px', width: '220px' }}
            />
          </div>

          {/* Event selector */}
          <select 
            value={eventFilter} 
            onChange={e => setEventFilter(e.target.value)}
            className="gdg-header-dropdown"
          >
            <option value="All">All Events</option>
            <option value="Era of Infinite Software">Era of Infinite Software</option>
            <option value="Vite & Rollup workshop">Vite & Rollup workshop</option>
            <option value="React Summit">React Summit</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Status Filters */}
          {['All', 'Confirmed', 'Checked In'].map(st => (
            <FilterPill 
              key={st}
              label={st} 
              active={statusFilter === st} 
              onClick={() => setStatusFilter(st)} 
            />
          ))}
          <button className="gdg-share-icon-btn" onClick={fetchRegistrations}><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Main Registrations Card */}
      <DashboardCard title="Centralized Registrations Workspace">
        {loading ? (
          <div className="gdg-spinner-container">
            <div className="gdg-spinner"></div>
            <span>Syncing registrations feed...</span>
          </div>
        ) : (
          <RegistrationTable 
            registrations={filtered}
            onCheckin={handleCheckin}
            onBulkCheckin={handleBulkCheckin}
            onExport={handleExportCSV}
          />
        )}
      </DashboardCard>

    </DashboardShell>
  );
}
