'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';

export default function NewContact() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organisation_id: ''
  });
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Set organization from user if available
    if (user && user.organisation_id && !formData.organisation_id) {
      setFormData(prev => ({
        ...prev,
        organisation_id: user.organisation_id
      }));
    }
    
    // Check for redirectTo in query params
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      setFormData(prev => ({
        ...prev,
        redirectTo
      }));
    }
    
    // Fetch organizations if user is authenticated
    if (user) {
      fetchOrganisations();
    }
  }, [user, authLoading, router, searchParams]);
  
  const getToken = () => {
    // Get token from localStorage
    return localStorage.getItem('token');
  };
  
  const fetchOrganisations = async () => {
    try {
      setFetchLoading(true);
      
      const token = getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      
      const data = await response.json();
      setOrganisations(data.organisations || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setFetchLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          organisation_id: formData.organisation_id || undefined
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create contact');
      }
      
      const newContact = await response.json();
      
      // Check if there's a redirect parameter
      if (formData.redirectTo) {
        router.push(formData.redirectTo);
      } else {
        // Default redirect to contacts list
        router.push('/contacts');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating contact:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // If still checking authentication, show loading
  if (authLoading || fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated (and not loading), we'll redirect in useEffect
  if (!user) {
    return null;
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Contact</h1>
        <p className="text-gray-600">Add a new contact to your system</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
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
              placeholder="Enter contact name"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter email address"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter phone number"
            />
          </div>
          
          {organisations.length > 0 && (
            <div className="mb-4">
              <label htmlFor="organisation_id" className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <select
                id="organisation_id"
                name="organisation_id"
                value={formData.organisation_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select an organization (optional)</option>
                {organisations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.organisation_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 mt-6">
            <Link 
              href={formData.redirectTo || '/contacts'} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}