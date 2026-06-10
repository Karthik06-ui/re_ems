import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BASE_URL = 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  });

  const apiRequest = async (urlPath, method = 'GET', body = null, authRequired = true) => {
    const headers = { 'Content-Type': 'application/json' };
    let token = accessToken;

    if (authRequired && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      let response = await fetch(`${BASE_URL}${urlPath}`, options);

      // Handle token expiration and automatic refresh
      if (response.status === 401 && authRequired && refreshToken) {
        const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.status === 200) {
          const refreshData = await refreshResponse.json();
          const newAccess = refreshData.access;
          setAccessToken(newAccess);
          localStorage.setItem('access_token', newAccess);

          // Retry with new access token
          headers['Authorization'] = `Bearer ${newAccess}`;
          response = await fetch(`${BASE_URL}${urlPath}`, options);
        } else {
          logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = { message: 'Empty response' };
      }

      return { status: response.status, data };
    } catch (error) {
      return { status: 500, data: { error: error.message } };
    }
  };

  const login = async (email, password, forceDemo = false) => {
    if (forceDemo) {
      console.log("Forcing Developer Demo Mode Session.");
      const devUser = {
        id: 999,
        name: 'Developer Admin',
        email: email || 'lead@kumaraguru.gdg.dev',
        role: 'chapter_lead'
      };
      setAccessToken('dev-jwt-token');
      setRefreshToken('dev-refresh-token');
      setCurrentUser(devUser);
      localStorage.setItem('access_token', 'dev-jwt-token');
      localStorage.setItem('refresh_token', 'dev-refresh-token');
      localStorage.setItem('user', JSON.stringify(devUser));
      return { success: true };
    }

    const { status, data } = await apiRequest('/api/v1/auth/token/', 'POST', { email, password }, false);
    if (status === 200) {
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setCurrentUser(data.user);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    }

    // Temporary Development Session Fallback if backend is down
    if (status === 500 || data.error?.includes('fetch') || data.error?.includes('Network') || data.error?.includes('Failed')) {
      console.warn("Backend server offline. Enabling Dev Session Fallback.");
      const devUser = {
        id: 999,
        name: 'Developer Admin',
        email: email || 'lead@kumaraguru.gdg.dev',
        role: 'chapter_lead'
      };
      setAccessToken('dev-jwt-token');
      setRefreshToken('dev-refresh-token');
      setCurrentUser(devUser);
      localStorage.setItem('access_token', 'dev-jwt-token');
      localStorage.setItem('refresh_token', 'dev-refresh-token');
      localStorage.setItem('user', JSON.stringify(devUser));
      return { success: true };
    }

    return { success: false, error: data.detail || 'Authentication failed' };
  };

  const register = async (name, email, password) => {
    const { status, data } = await apiRequest('/api/v1/auth/register/', 'POST', { name, email, password }, false);
    if (status === 201) {
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setCurrentUser(data.user);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    }
    return { success: false, error: data.email ? data.email[0] : 'Registration failed' };
  };

  const logout = () => {
    setAccessToken('');
    setRefreshToken('');
    setCurrentUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  const fetchProfile = async () => {
    if (!accessToken) return;
    if (accessToken === 'dev-jwt-token') return; // Bypass call if using dev session
    const { status, data } = await apiRequest('/api/v1/auth/me/', 'GET', null, true);
    if (status === 200) {
      setCurrentUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    }
  };

  return (
    <AuthContext.Provider value={{
      user: currentUser,
      token: accessToken,
      login,
      register,
      logout,
      fetchProfile,
      apiRequest,
      isAuthenticated: !!accessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
