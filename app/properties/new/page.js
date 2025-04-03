'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';

export default function NewProperty() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner_id: '',
    status: 'Available'
  });
  const [contacts, setContacts] = useState([]);
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

    // Check for owner_id in query params
    const ownerId = searchParams.get('owner_id');
    if (ownerId) {
      setFormData(prev => ({
        ...prev,
        owner_id: ownerId
      }));
    }
    
    // Fetch contacts if user is authenticated
    if (user) {
      fetchContacts();
    }
  }, [user, authLoading, router, searchParams]);
  
  const getToken = () => {
    // Get token from localStorage
    return localStorage.getItem('token');
  };
  
  const fetchContacts = async () => {
    try {
      setFetchLoading(true);
      
      // Get token from localStorage
      const token = getToken();
      
      if (!token) {
        throw new Error('Authentication required - No token found in localStorage');
      }
      
      // Fetch contacts with authorization header
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Session expired. Please log in again.');
        }
        
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch contacts');
      }
      
      const data = await response.json();
      setContacts(data.contacts || []);
      
      // Check if there are any contacts
      if (data.contacts?.length === 0) {
        console.log('No contacts found');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
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
      // Get token from localStorage
      const token = getToken();
      
      if (!token) {
        throw new Error('Authentication required - No token found in localStorage');
      }
      
      // Create property with authorization header
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          owner_id: formData.owner_id ? parseInt(formData.owner_id, 10) : undefined
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Session expired. Please log in again.');
        }
        
        const data = await response.json();
        throw new Error(data.error || 'Failed to create property');
      }
      
      // Redirect to properties list
      router.push('/properties');
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateContactFirst = () => {
    // Redirect to contacts/new with a redirect parameter back to properties/new
    router.push('/contacts/new?redirectTo=properties/new');
  };
  
  // If still checking authentication or loading contacts, show loading spinner
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
  
  // If no contacts exist, show a message and option to create contacts first
  if (contacts.length === 0 && !loading && !fetchLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">New Property</h1>
          <p className="text-gray-600">Add a new property to your portfolio</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">No Contacts Available</h2>
            <p className="text-gray-600 mb-6">
              You need to create at least one contact before adding a property.
              Contacts can be assigned as property owners.
            </p>
            <button
              onClick={handleCreateContactFirst}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Contact First
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Property</h1>
        <p className="text-gray-600">Add a new property to your portfolio</p>
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
              Property Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter property name"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter property address"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 mb-1">
              Owner
            </label>
            <div className="flex space-x-2">
              <select
                id="owner_id"
                name="owner_id"
                value={formData.owner_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select an owner (optional)</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
              <Link 
                href="/contacts/new?redirectTo=properties/new"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
              >
                <span>+ New</span>
              </Link>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Available">Available</option>
              <option value="Under Contract">Under Contract</option>
              <option value="Sold">Sold</option>
              <option value="Listed">Listed</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/properties" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}