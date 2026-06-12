import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  StatCard, 
  DashboardCard, 
  QuickActionCard, 
  ActivityFeed,
  EventStatusBadge
} from '../../components/DashboardComponents';
import { 
  Plus, Send, Award, Users, Calendar, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


export default function DashboardOverview() {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();


  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    events: 0,
    upcoming: 0,
    registrations: 0,
    attendance: 85.5,
    members: 0
  });

  const [recentEvents, setRecentEvents] = useState([]);
  const [activities, setActivities] = useState([
    { id: 1, content: 'Sponsor added: Vercel joined Silver Tier placements', timestamp: '10m ago' },
    { id: 2, content: 'User check-in: guest.user@college.edu checked in at Era of Infinite Software', timestamp: '40m ago' },
    { id: 3, content: 'Waitlist promotion: karthik@gdgdemo.org promoted to confirmed seat', timestamp: '2h ago' },
    { id: 4, content: 'Campaign sent: Dev Summit Newsletter dispatched to all members', timestamp: '1d ago' }
  ]);

  const fetchOverviewData = async () => {
    setLoading(true);
    
    // Fetch counts from `/api/v1/analytics/overview/`
    const { status, data } = await apiRequest('/api/v1/analytics/overview/', 'GET', null, true);
    if (status === 200) {
      setCounts({
        events: data.total_events || 3,
        upcoming: Math.max(0, (data.total_events || 3) - 1),
        registrations: data.total_registrations || 309,
        attendance: data.engagement_metrics?.attendance_rate || 85.5,
        members: data.total_members || 393
      });
    }

    // Fetch recent events
    const eventRes = await apiRequest('/api/v1/events/', 'GET', null, true);
    if (eventRes.status === 200) {
      setRecentEvents(eventRes.data.slice(0, 3));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const quickActions = [
    { label: 'Create Event', icon: Plus, onClick: () => navigate('/dashboard/events') },
    { label: 'Create Campaign', icon: Send, onClick: () => navigate('/dashboard/campaigns') },
    { label: 'Add Sponsor', icon: Award, onClick: () => navigate('/dashboard/sponsors') },
    { label: 'Invite Member', icon: Users, onClick: () => navigate('/dashboard/members') },
  ];

  return (
    <DashboardShell sectionTitle="Dashboard">
      
      {/* 1. STATS METRICS WIDGETS */}
      <div className="gdg-stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard value={counts.events} label="Total Events" emoji="🎤" tooltip="Lifetime chapter event configurations" />
        <StatCard value={counts.upcoming} label="Upcoming Events" emoji="⏰" tooltip="Published drafts scheduled next" />
        <StatCard value={counts.registrations} label="Active Registrations" emoji="🎫" tooltip="Confirmed ticket bookings" />
        <StatCard value={counts.attendance + "%"} label="Attendance Rate" emoji="📈" tooltip="Checked-in attendees ratio" />
        <StatCard value={counts.members} label="Active Members" emoji="👥" tooltip="Registered developer community accounts" />
      </div>

      {/* 2. REUSABLE CARDS LAYOUT */}
      <div className="gdg-grid-2-1">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Recent Events Card */}
          <DashboardCard 
            title="Recent Chapter Events" 
            action={<Link to="/dashboard/events" className="blue-link" style={{ fontSize: '13px' }}>View All</Link>}
          >
            {loading ? (
              <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gdg-text-secondary)' }}>Syncing events timeline...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentEvents.length === 0 ? (
                  <p style={{ fontStyle: 'italic', color: 'var(--gdg-text-secondary)', fontSize: '13px' }}>No events published yet.</p>
                ) : null}
                {recentEvents.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gdg-border)', paddingBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{ev.title}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--gdg-text-secondary)' }}>📍 {ev.venue} | Capacity: {ev.capacity}</span>
                    </div>
                    <EventStatusBadge status={ev.status} />
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Recent Registrations log block */}
          <DashboardCard title="Recent Registrations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '8px 12px', border: '1px solid var(--gdg-border)', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span>karthik@gdgdemo.org</span>
                <span style={{ color: 'var(--gdg-success)', fontWeight: 'bold' }}>Confirmed</span>
              </div>
              <div style={{ padding: '8px 12px', border: '1px solid var(--gdg-border)', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span>guest.user@college.edu</span>
                <span style={{ color: 'var(--gdg-blue)', fontWeight: 'bold' }}>Checked In</span>
              </div>
              <div style={{ padding: '8px 12px', border: '1px solid var(--gdg-border)', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span>lead@kumaraguru.gdg.dev</span>
                <span style={{ color: 'var(--gdg-success)', fontWeight: 'bold' }}>Confirmed</span>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Actions Card */}
          <DashboardCard title="Quick Actions">
            <QuickActionCard actions={quickActions} />
          </DashboardCard>

          {/* Activity Stream Feed */}
          <DashboardCard 
            title="Dashboard Activity Stream" 
            action={<button className="gdg-share-icon-btn" onClick={fetchOverviewData}><RefreshCw size={12} /></button>}
          >
            <ActivityFeed activities={activities} />
          </DashboardCard>
        </div>
      </div>

    </DashboardShell>
  );
}
