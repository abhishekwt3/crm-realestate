'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create auth context
const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {}
});

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        setUser(null);
        return { success: false, message: 'No token found' };
      }
      
      // Fetch user data with token in Authorization header
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.log('Auth check failed with status:', response.status);
        setUser(null);
        // Clear invalid token
        localStorage.removeItem('token');
        return { success: false, message: 'Invalid token' };
      }
      
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        console.log('User authenticated:', data.user.email);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        console.log('User not authenticated');
        setUser(null);
        // Clear invalid token
        localStorage.removeItem('token');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err.message);
      setUser(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store user data
      setUser(data.user);
      
      // Store token in localStorage
      if (data.token) {
        console.log('Setting token in localStorage');
        localStorage.setItem('token', data.token);
      }
      
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Store user data
      setUser(data.user);
      
      // Store token in localStorage
      if (data.token) {
        console.log('Setting token in localStorage after registration');
        localStorage.setItem('token', data.token);
      }
      
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear user data
      setUser(null);
      
      // Remove token from localStorage
      console.log('Removing token from localStorage');
      localStorage.removeItem('token');
      
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      
      // Still remove token on error
      localStorage.removeItem('token');
      setUser(null);
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
    
    // Set up event listener for storage changes (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token was removed
          setUser(null);
        } else if (e.newValue !== e.oldValue) {
          // Token changed, refresh auth state
          checkAuth();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  return useContext(AuthContext);
}