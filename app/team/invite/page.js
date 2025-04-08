'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';

export default function InviteTeamMember() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Ensure user has an organization
    if (user && !user.organisation_id) {
      router.push('/onboarding/create-organization');
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create team member directly without sending email
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_member_name: formData.name,
          team_member_email_id: formData.email,
          organisation_id: user.organisation_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team member');
      }

      const data = await response.json();
      
      // Show success message
      setSuccess(`Team member ${formData.name} added successfully! (Note: Email invitation disabled in development mode)`);
      
      // Clear form data
      setFormData({
        name: '',
        email: '',
        role: 'member'
      });
    } catch (err) {
      console.error('Error inviting team member:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invite Team Member</h1>
        <p className="text-gray-600">Send an invitation to join your organization</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter team member's name"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter team member's email"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="member">Team Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/team" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Adding Team Member...' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-2">Development Mode Note</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm">
            <strong>Note:</strong> Email sending is disabled in development mode. Team members are added directly to the database.
          </p>
        </div>
      </div>
    </div>
  );
}