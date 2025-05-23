// app/providers/AuthProvider.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation, useLazyQuery, gql } from '@apollo/client';

// GraphQL Queries & Mutations
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        role
        organisationId
      }
      setupRequired
      nextStep
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        role
      }
      setupRequired
      nextStep
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
      organisationId
      organisation {
        id
        organisationName
      }
      teamMember {
        id
        teamMemberName
      }
    }
  }
`;

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

  // Setup GraphQL operations
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [getMe, { loading: meLoading }] = useLazyQuery(ME_QUERY);

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
      
      // Fetch user data with GraphQL
      const { data } = await getMe();
      
      if (data && data.me) {
        setUser(data.me);
        return { success: true, user: data.me };
      } else {
        setUser(null);
        localStorage.removeItem('token');
        return { success: false, message: 'Invalid token' };
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
      
      const { data } = await loginMutation({
        variables: {
          input: { email, password }
        }
      });
      
      if (data.login) {
        // Store user data
        setUser(data.login.user);
        
        // Store token in localStorage
        if (data.login.token) {
          localStorage.setItem('token', data.login.token);
        }
        
        return { 
          success: true, 
          user: data.login.user,
          setupRequired: data.login.setupRequired,
          nextStep: data.login.nextStep 
        };
      }
      
      throw new Error('Login failed');
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
      
      const { data } = await registerMutation({
        variables: {
          input: userData
        }
      });
      
      if (data.register) {
        // Store user data
        setUser(data.register.user);
        
        // Store token in localStorage
        if (data.register.token) {
          localStorage.setItem('token', data.register.token);
        }
        
        return { 
          success: true, 
          user: data.register.user,
          setupRequired: data.register.setupRequired,
          nextStep: data.register.nextStep
        };
      }
      
      throw new Error('Registration failed');
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
      loading: loading || meLoading,
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