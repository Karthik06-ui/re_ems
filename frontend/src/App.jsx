import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import AnalyticsDashboard from './pages/dashboard/AnalyticsDashboard';
import EventList from './pages/dashboard/EventList';
import EventDetailWorkspace from './pages/dashboard/EventDetailWorkspace';
import RegistrationsDashboard from './pages/dashboard/RegistrationsDashboard';
import MembersDashboard from './pages/dashboard/MembersDashboard';
import CampaignsDashboard from './pages/dashboard/CampaignsDashboard';
import SponsorsDashboard from './pages/dashboard/SponsorsDashboard';
import SettingsWorkspace from './pages/dashboard/SettingsWorkspace';
import './App.css';

function MainLayout() {
  return (
    <Routes>
      {/* Root redirect to Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* AUTHENTICATION PORTAL */}
      <Route path="/auth/login" element={<AuthPage />} />
      
      {/* INTERNAL EVENT MANAGEMENT DASHBOARD ROUTES */}
      <Route path="/dashboard" element={<DashboardOverview />} />
      <Route path="/dashboard/analytics" element={<Navigate to="/dashboard/analytics/overview" replace />} />
      <Route path="/dashboard/analytics/:tab" element={<AnalyticsDashboard />} />
      <Route path="/dashboard/events" element={<EventList />} />
      <Route path="/dashboard/events/:id" element={<Navigate to="overview" replace />} />
      <Route path="/dashboard/events/:id/:tab" element={<EventDetailWorkspace />} />
      <Route path="/dashboard/registrations" element={<RegistrationsDashboard />} />
      <Route path="/dashboard/members" element={<MembersDashboard />} />
      <Route path="/dashboard/campaigns" element={<CampaignsDashboard />} />
      <Route path="/dashboard/sponsors" element={<SponsorsDashboard />} />
      <Route path="/dashboard/settings" element={<Navigate to="/dashboard/settings/team" replace />} />
      <Route path="/dashboard/settings/:tab" element={<SettingsWorkspace />} />
      
      {/* Legacy/Fallback redirects */}
      <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
