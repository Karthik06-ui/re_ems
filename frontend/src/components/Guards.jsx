import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/portal') ? '/portal/login' : '/auth/login';
    return <Navigate to={`${loginPath}${location.search}`} replace />;
  }

  return <Outlet />;
}

export function ProfileGate() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/portal') ? '/portal/login' : '/auth/login';
    return <Navigate to={`${loginPath}${location.search}`} replace />;
  }

  if (!user?.is_profile_completed) {
    return <Navigate to={`/portal/profile${location.search}`} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/auth/login${location.search}`} replace />;
  }

  const adminRoles = ['platform_admin', 'chapter_lead', 'organizer'];
  if (!adminRoles.includes(user?.role)) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
