'use client';

import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DealList from '../components/DealList';

export default function DealsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // If still checking authentication, show loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated (and not loading), we'll redirect in useEffect
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Deals Dashboard</h1>
        <p className="text-gray-600">Manage your deals pipeline</p>
      </div>

      <DealList />
    </div>
  );
}