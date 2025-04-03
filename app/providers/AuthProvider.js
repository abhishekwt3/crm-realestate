'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../lib/apiClient';

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        setUser(null);
        return { success: false, message: 'No token found' };
      }
      
      // Fetch user data
      const data = await apiClient.getCurrentUser();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        setUser(null);
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
      
      // Direct API call, not using apiClient to avoid token handling
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store user data
      setUser(data.user);
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return { 
        success: true, 
        user: data.user,
        setupRequired: data.setupRequired,
        nextStep: data.nextStep 
      };
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
      
      // Direct API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Store user data
      setUser(data.user);
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return { 
        success: true, 
        user: data.user,
        setupRequired: data.setupRequired,
        nextStep: data.nextStep
      };
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
      
      // Clear user data
      setUser(null);
      
      // Remove token from localStorage
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
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}