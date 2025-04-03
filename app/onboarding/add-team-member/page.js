'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';

export default function AddTeamMemberPage() {
  const [teamMemberData, setTeamMemberData] = useState({
    team_member_name: '',
    team_member_email_id: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Make sure user has an organization
    if (user && !user.organisation_id) {
      router.push('/onboarding/create-organization');
      return;
    }

    // Fetch existing team members
    fetchTeamMembers();
  }, [user, router]);

  const fetchTeamMembers = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/team', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeamMemberData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamMemberData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team member');
      }

      // Clear form data
      setTeamMemberData({
        team_member_name: '',
        team_member_email_id: ''
      });

      // Show success message
      setSuccess('Team member added successfully!');
      
      // Refresh the list
      fetchTeamMembers();
    } catch (err) {
      setError(err.message);
      console.error('Error adding team member:', err);
    } finally {
      setLoading(false);
    }
  };

  // Continue to dashboard button handler
  const handleContinue = () => {
    router.push('/dashboard');
  };

  // Prevent access if not logged in
  if (!user) {
    return null;
  }

  // If user doesn't have an organization, redirect (handled by useEffect)
  if (user && !user.organisation_id) {
    return (
      <div className="text-center py-8">
        <p>You need to create an organization first. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Add Team Members
        </h2>
  
        <p className="text-center text-gray-600 mb-6">
          Invite team members to collaborate in your organization
        </p>
  
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
            <p>{success}</p>
          </div>
        )}
        
        {fetchLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2">Loading team members...</p>
          </div>
        ) : (
          <>
            {/* Current team members list */}
            {teamMembers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Current Team Members</h3>
                <ul className="bg-gray-50 rounded-md p-3">
                  {teamMembers.map(member => (
                    <li key={member.id} className="py-2 border-b border-gray-200 last:border-0">
                      <p className="font-medium">{member.team_member_name}</p>
                      <p className="text-sm text-gray-500">{member.team_member_email_id}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="team_member_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Team Member Name
                </label>
                <input
                  id="team_member_name"
                  name="team_member_name"
                  type="text"
                  required
                  value={teamMemberData.team_member_name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter team member name"
                />
              </div>
      
              <div>
                <label htmlFor="team_member_email_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Team Member Email
                </label>
                <input
                  id="team_member_email_id"
                  name="team_member_email_id"
                  type="email"
                  required
                  value={teamMemberData.team_member_email_id}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter team member email"
                />
              </div>
      
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Team Member'}
                </button>
      
                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Continue to Dashboard
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}