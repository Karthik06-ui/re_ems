import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import PublicEventPage from './pages/PublicEventPage';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import AnalyticsDashboard from './pages/dashboard/AnalyticsDashboard';
import EventList from './pages/dashboard/EventList';
import EventDetailWorkspace from './pages/dashboard/EventDetailWorkspace';
import RegistrationsDashboard from './pages/dashboard/RegistrationsDashboard';
import MembersDashboard from './pages/dashboard/MembersDashboard';
import CampaignsDashboard from './pages/dashboard/CampaignsDashboard';
import SponsorsDashboard from './pages/dashboard/SponsorsDashboard';
import SettingsWorkspace from './pages/dashboard/SettingsWorkspace';

// Portal components
import ParticipantDashboard from './pages/portal/ParticipantDashboard';
import ParticipantProfile from './pages/portal/ParticipantProfile';
import ParticipantEventDetail from './pages/portal/ParticipantEventDetail';

// Guards
import { ProtectedRoute, ProfileGate, AdminRoute } from './components/Guards';

import './App.css';

const isDev = import.meta.env.DEV;
const PublicGlobalSite = lazy(() => import('./dev/PublicGlobalSite'));

function EventDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/events/${id}/overview`} replace />;
}

function MainLayout() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/portal" replace />} />
      
      {/* DEV ONLY ROUTE */}
      {isDev && (
        <Route 
          path="/global-site" 
          element={
            <Suspense fallback={<div className="portal-loader" style={{ textAlign: 'center', marginTop: '40px' }}>Loading public global site...</div>}>
              <PublicGlobalSite />
            </Suspense>
          } 
        />
      )}

      {/* AUTHENTICATION PORTAL */}
      <Route path="/auth/login" element={<AuthPage />} />
      
      {/* PUBLIC EVENT PAGE */}
      <Route path="/events/:id" element={<PublicEventPage />} />
      
      {/* PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>
        {/* PROFILE GATED (MEMBERS ONLY FOR PARTICIPATING) */}
        <Route element={<ProfileGate />}>
          <Route path="/portal" element={<ParticipantDashboard />} />
          <Route path="/portal/events/:id" element={<ParticipantEventDetail />} />
        </Route>

        {/* PROFILE GATED-FREE (TO LET USERS COMPLETE PROFILE) */}
        <Route path="/portal/profile" element={<ParticipantProfile />} />

        {/* INTERNAL EVENT MANAGEMENT DASHBOARD ROUTES (ADMIN ONLY) */}
        <Route element={<AdminRoute />}>
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/analytics" element={<Navigate to="/dashboard/analytics/overview" replace />} />
          <Route path="/dashboard/analytics/:tab" element={<AnalyticsDashboard />} />
          <Route path="/dashboard/events" element={<EventList />} />
          <Route path="/dashboard/events/:id" element={<EventDetailRedirect />} />
          <Route path="/dashboard/events/:id/:tab" element={<EventDetailWorkspace />} />
          <Route path="/dashboard/registrations" element={<RegistrationsDashboard />} />
          <Route path="/dashboard/members" element={<MembersDashboard />} />
          <Route path="/dashboard/campaigns" element={<CampaignsDashboard />} />
          <Route path="/dashboard/sponsors" element={<SponsorsDashboard />} />
          <Route path="/dashboard/settings" element={<Navigate to="/dashboard/settings/overview" replace />} />
          <Route path="/dashboard/settings/:tab" element={<SettingsWorkspace />} />
        </Route>
      </Route>
      
      {/* Legacy/Fallback redirects */}
      <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/portal" replace />} />
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
