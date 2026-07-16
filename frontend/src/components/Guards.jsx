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
  const { user, isAuthenticated, profileSelected } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/auth/login${location.search}`} replace />;
  }

  if (!user?.is_admin) {
    return <Navigate to="/portal" replace />;
  }

  // Admin users must select a profile before accessing dashboard pages
  if (!profileSelected && location.pathname !== '/auth/profile-select') {
    return <Navigate to="/auth/profile-select" replace />;
  }

  return <Outlet />;
}

export function ProfileRequiredRoute() {
  const { user, isAuthenticated, profileSelected } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!user?.is_admin) return <Navigate to="/portal" replace />;
  if (!profileSelected) return <Navigate to="/auth/profile-select" replace />;
  return <Outlet />;
}
