'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading, error, checkAuth } = useAuth();
  const [pageStatus, setPageStatus] = useState('loading');
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setPageStatus('checking');
        
        // If already loaded and no user, redirect
        if (!loading && !user) {
          router.push('/login');
          return;
        }
        
        // If still loading, wait
        if (loading) {
          return;
        }
        
        // Double-check auth if needed
        if (!user) {
          const result = await checkAuth();
          if (!result.success) {
            router.push('/login');
            return;
          }
        }
        
        setPageStatus('loaded');
      } catch (e) {
        console.error('Auth check error:', e);
        setPageStatus('error');
      }
    };
    
    checkAuthentication();
  }, [user, loading, router, checkAuth]);

  if (pageStatus === 'loading' || pageStatus === 'checking' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (pageStatus === 'error' || error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-red-800 mb-2">Authentication Error</h2>
        <p className="text-red-700 mb-4">There was a problem loading your dashboard.</p>
        <button
          onClick={() => router.push('/login')}
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