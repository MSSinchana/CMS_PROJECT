import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('cms-auth-logout', handleForcedLogout);

    return () => window.removeEventListener('cms-auth-logout', handleForcedLogout);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('cms_token');
      const savedUser = localStorage.getItem('cms_user');

      if (!token || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
      } catch (error) {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: nextUser } = response.data.data;

    saveSession(token, nextUser);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    const { token, user: nextUser } = response.data.data;

    saveSession(token, nextUser);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Client-side logout still succeeds if the token is already expired.
    } finally {
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_user');
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function saveSession(token, nextUser) {
  localStorage.setItem('cms_token', token);
  localStorage.setItem('cms_user', JSON.stringify(nextUser));
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
