'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';

export default function AddTeamMemberPage() {
  const [teamMemberData, setTeamMemberData] = useState({
    team_member_name: '',
    team_member_email_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeamMemberData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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

      const teamMember = await response.json();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error('Error adding team member:', err);
    } finally {
      setLoading(false);
    }
  };

  // Skip button handler
  const handleSkip = () => {
    router.push('/dashboard');
  };

  // Prevent access if not logged in
  if (!user) {
    return null;
  }

return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Add Your First Team Member
        </h2>
  
        <p className="text-center text-gray-600 mb-6">
          Invite a team member to collaborate in your organization
        </p>
  
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
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
              onClick={handleSkip}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Skip for Now
            </button>
          </div>
        </form>
  
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>You can always add more team members later</p>
          <Link 
            href="/dashboard" 
            className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
    )};