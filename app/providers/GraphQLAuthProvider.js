'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { graphqlRequest, LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '../../lib/graphqlClient';

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
      
      // Fetch user data using GraphQL
      const data = await graphqlRequest(ME_QUERY, {}, token);
      
      if (data && data.me) {
        setUser(data.me);
        return { success: true, user: data.me };
      } else {
        setUser(null);
        localStorage.removeItem('token');
        return { success: false, message: 'Session expired or invalid' };
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err.message);
      setUser(null);
      localStorage.removeItem('token');
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
      
      // Call GraphQL login mutation
      const variables = {
        input: { email, password }
      };
      
      const data = await graphqlRequest(LOGIN_MUTATION, variables);
      
      if (!data || !data.login) {
        throw new Error('Login failed');
      }
      
      const { token, user, setupRequired, nextStep } = data.login;
      
      // Store user data
      setUser(user);
      
      // Store token in localStorage
      if (token) {
        localStorage.setItem('token', token);
      }
      
      return { 
        success: true, 
        user,
        setupRequired,
        nextStep 
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
      
      // Prepare input for GraphQL mutation
      const variables = {
        input: {
          email: userData.email,
          password: userData.password,
          role: userData.role || 'admin'
        }
      };
      
      // Call GraphQL register mutation
      const data = await graphqlRequest(REGISTER_MUTATION, variables);
      
      if (!data || !data.register) {
        throw new Error('Registration failed');
      }
      
      const { token, user, setupRequired, nextStep } = data.register;
      
      // Store user data
      setUser(user);
      
      // Store token in localStorage
      if (token) {
        localStorage.setItem('token', token);
      }
      
      return { 
        success: true, 
        user,
        setupRequired,
        nextStep
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