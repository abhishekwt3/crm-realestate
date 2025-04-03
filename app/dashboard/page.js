'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log("No token found, redirecting to login");
          window.location.href = '/login';
          return;
        }
        
        // Fetch user data using the token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token invalid or expired
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
          
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          console.log("User authenticated:", data.user);
          setUser(data.user);
        } else {
          // Not authenticated
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Login
        </button>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.email}</p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Your Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Role:</span> {user.role}</p>
            {user.organisation_name && (
              <p><span className="font-medium">Organization:</span> {user.organisation_name}</p>
            )}
          </div>
          {user.team_member && (
            <div>
              <p><span className="font-medium">Team Member:</span> {user.team_member.team_member_name}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Properties</h3>
          <p className="text-gray-600 mb-4">Manage your property portfolio</p>
          <Link href="/properties" className="text-indigo-600 hover:text-indigo-800 font-medium">
            View Properties →
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Contacts</h3>
          <p className="text-gray-600 mb-4">Manage your contacts</p>
          <Link href="/contacts" className="text-indigo-600 hover:text-indigo-800 font-medium">
            View Contacts →
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Deals</h3>
          <p className="text-gray-600 mb-4">Track your deals pipeline</p>
          <Link href="/deals" className="text-indigo-600 hover:text-indigo-800 font-medium">
            View Deals →
          </Link>
        </div>
      </div>
    </div>
  );
}