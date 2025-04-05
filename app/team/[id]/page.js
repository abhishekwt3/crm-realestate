'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';

export default function TeamMemberDetail({ params }) {
  const memberId = params.id;
  const { user, loading: authLoading } = useAuth();
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch team member details if authenticated
    if (user) {
      fetchTeamMember();
    }
  }, [user, authLoading, router, memberId]);

  const fetchTeamMember = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch team member details
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/team/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Handle 404 specifically for member not found
        if (response.status === 404) {
          throw new Error('Team member not found. They may have been removed from your organization.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch team member details');
      }

      const data = await response.json();
      setTeamMember(data.teamMember);
    } catch (err) {
      console.error('Error fetching team member details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async () => {
    try {
      setResendLoading(true);
      setResendSuccess(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Resend invitation
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/team/invite/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_member_id: teamMember.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend invitation');
      }

      setResendSuccess('Invitation resent successfully');
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  // If still checking authentication, show loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
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

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Error state - with more helpful messaging
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <svg className="h-16 w-16 text-red-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold mt-4 mb-2">Team Member Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-4">
            <Link 
              href="/team" 
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Team List
            </Link>
            
            <Link 
              href="/team/invite" 
              className="inline-block ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Invite Team Member
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Team member not found
  if (!teamMember) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <svg className="h-16 w-16 text-yellow-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold mt-4 mb-2">Team Member Not Found</h2>
          <p className="text-gray-600 mb-6">
            The team member you're looking for doesn't exist or has been removed from your organization.
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/team" 
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Team List
            </Link>
            
            <Link 
              href="/team/invite" 
              className="inline-block ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Invite Team Member
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normal view when team member exists
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{teamMember.team_member_name}</h1>
          <p className="text-gray-600">{teamMember.team_member_email_id}</p>
        </div>
        <Link href="/team" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
          Back to Team
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center mr-6">
            <span className="text-indigo-700 text-4xl">👤</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{teamMember.team_member_name}</h2>
            <p className="text-gray-600">{teamMember.team_member_email_id}</p>
            <div className="mt-2">
              {teamMember.user ? (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Invited - Pending
                </span>
              )}
            </div>
          </div>
        </div>
        
        {resendSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {resendSuccess}
          </div>
        )}
        
        {!teamMember.user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Invitation Pending</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This team member hasn't accepted their invitation yet.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleResendInvitation}
                    disabled={resendLoading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    {resendLoading ? 'Resending...' : 'Resend Invitation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium mb-4">Team Member Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="mt-1">{teamMember.team_member_name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1">{teamMember.team_member_email_id}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1">{teamMember.user ? 'Active' : 'Pending'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="mt-1">{teamMember.user?.role || 'Member'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}