import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardShell from './DashboardShell';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { Info, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import { StatCard, DashboardCard } from '../../components/DashboardComponents';

export default function AnalyticsDashboard() {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { apiRequest } = useAuth();

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    events: 0,
    registrations: 0,
    members: 0,
    rate: 0
  });

  const [teamMetrics, setTeamMetrics] = useState({
    totalTeams: 0,
    registeredTeams: 0,
    averageTeamSize: 0,
    pendingInvitations: 0,
    acceptedInvitations: 0
  });

  const [registrationsOverTime, setRegistrationsOverTime] = useState([]);
  const [capacityUtilization, setCapacityUtilization] = useState([]);
  const [memberGrowth, setMemberGrowth] = useState([]);
  const [sponsorEngagement, setSponsorEngagement] = useState([]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);

    const fetchOverviewData = async () => {
      const { status, data } = await apiRequest('/api/v1/analytics/overview/', 'GET', null, true);
      if (status === 200) {
        setStats({
          events: data.total_events || 0,
          registrations: data.total_registrations || 0,
          members: data.total_members || 0,
          rate: data.engagement_metrics?.attendance_rate || 0
        });
        setRegistrationsOverTime(data.registrations_over_time || []);
        setCapacityUtilization(data.capacity_utilization || []);
        setMemberGrowth(data.member_growth || []);
        setSponsorEngagement(data.sponsor_engagement || []);
        setTeamMetrics({
          totalTeams: data.team_metrics?.total_teams || 0,
          registeredTeams: data.team_metrics?.registered_teams || 0,
          averageTeamSize: data.team_metrics?.average_team_size || 0,
          pendingInvitations: data.team_metrics?.pending_invitations || 0,
          acceptedInvitations: data.team_metrics?.accepted_invitations || 0
        });
      }
    };
    fetchOverviewData();

    return () => clearTimeout(timer);
  }, [tab]);

  // Operational tab selections only
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'events', label: 'Events' },
    { id: 'members', label: 'Members' },
    { id: 'sponsors', label: 'Sponsors' }
  ];

  return (
    <DashboardShell sectionTitle="Analytics">
      
      {/* 1. HORIZONTAL TABS */}
      <div className="gdg-tabs-container">
        {tabs.map(t => (
          <button 
            key={t.id}
            className={`gdg-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => navigate(`/dashboard/analytics/${t.id}`)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 2. LOADING STATE */}
      {loading ? (
        <div className="gdg-spinner-container">
          <div className="gdg-spinner"></div>
          <span>Syncing operational charts...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <>
              {/* ACCOMPLISHMENTS BANNER CARD */}
              <div className="gdg-accomplishments-card">
                <h3 className="gdg-accomplishments-title">Celebrate your accomplishments in 2025!</h3>
                <p className="gdg-accomplishments-sub">
                  Thanks to everyone who made the magic happen—here's to even more community, collaboration, and unforgettable moments in the year ahead.
                </p>
                <div className="gdg-accomplishments-dots">
                  <span className="dot-accent dot-black"></span>
                  <span className="dot-accent dot-pink"></span>
                  <span className="dot-accent dot-gold"></span>
                  <span className="dot-accent dot-blue"></span>
                </div>
              </div>

              {/* STATS GRID */}
              <div className="gdg-stat-grid" style={{ marginBottom: '24px' }}>
                <StatCard value={stats.events} label="Total Events" emoji="🎤" />
                <StatCard value={stats.registrations} label="Total Registrations" emoji="🎫" />
                <StatCard value={stats.members} label="Total Members" emoji="👥" />
                <StatCard value={stats.rate + "%"} label="Attendance Rate" emoji="📈" />
              </div>

              {/* TEAM METRICS */}
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '24px 0 16px 0', color: 'var(--gdg-text-primary)' }}>
                Team Registration Analytics
              </h3>
              <div className="gdg-stat-grid">
                <StatCard value={teamMetrics.totalTeams} label="Total Teams Created" emoji="🛡️" />
                <StatCard value={teamMetrics.registeredTeams} label="Registered Teams" emoji="✅" />
                <StatCard value={teamMetrics.averageTeamSize} label="Avg Team Size" emoji="👨‍👦‍👦" />
                <StatCard value={teamMetrics.pendingInvitations} label="Pending Invitations" emoji="✉️" />
              </div>
            </>
          )}

          {/* TAB 2: EVENTS */}
          {tab === 'events' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="gdg-grid-2-1">
                {/* Registrations Over Time */}
                <DashboardCard title="Registrations Over Time">
                  <div style={{ height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={registrationsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#9AA0A6" fontSize={11} />
                        <YAxis stroke="#9AA0A6" fontSize={11} />
                        <Tooltip />
                        <Line type="monotone" dataKey="registered" stroke="var(--gdg-blue)" strokeWidth={2} name="Registered Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>

                {/* Capacity Utilization */}
                <DashboardCard title="Capacity Utilization">
                  <div style={{ height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={capacityUtilization}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#9AA0A6" fontSize={10} />
                        <YAxis stroke="#9AA0A6" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="registrations" fill="var(--gdg-purple)" name="Registrants" />
                        <Bar dataKey="capacity" fill="#E8EAED" name="Seating Capacity" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS */}
          {tab === 'members' && (
            <div className="gdg-grid-2-1">
              {/* Member Growth */}
              <DashboardCard title="Member Growth Over Time">
                <div style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memberGrowth}>
                      <defs>
                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--gdg-blue)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--gdg-blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#9AA0A6" fontSize={11} />
                      <YAxis stroke="#9AA0A6" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="members" stroke="var(--gdg-blue)" fillOpacity={1} fill="url(#colorMem)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              {/* Active Participation */}
              <DashboardCard title="Active Member Participation">
                <div style={{ height: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <h4 style={{ fontSize: '48px', color: 'var(--gdg-blue)', margin: '0 0 10px 0', fontWeight: 300 }}>71.2%</h4>
                  <p style={{ color: 'var(--gdg-text-secondary)', fontSize: '13px', maxWidth: '200px' }}>
                    Ratio of registered members who attended at least one chapter workshop in 2025.
                  </p>
                </div>
              </DashboardCard>
            </div>
          )}

          {/* TAB 4: SPONSORS */}
          {tab === 'sponsors' && (
            <DashboardCard title="Sponsor Clicks & Brand Placements Engagement">
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sponsorEngagement}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#9AA0A6" fontSize={11} />
                    <YAxis stroke="#9AA0A6" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" fill="var(--gdg-blue)" name="Logo Impressions" />
                    <Bar dataKey="clicks" fill="var(--gdg-teal)" name="Placements Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>
          )}

        </div>
      )}

    </DashboardShell>
  );
}
