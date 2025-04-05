'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';

export default function Contacts() {
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch contacts if authenticated and user has an organization
    if (user && user.organisation_id) {
      fetchContacts();
    }
  }, [user, authLoading, router, filter]);
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare URL with organization ID and optional search filter
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/contacts`;
      const params = new URLSearchParams();
      
      // Add organization ID filter
      params.append('organisation_id', user.organisation_id);
      
      // Add search query if exists
      if (filter) {
        params.append('query', filter);
      }
      
      url += `?${params.toString()}`;
      
      // Fetch contacts
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contacts');
      }
      
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      
      // Handle specific error scenarios
      if (err.message.includes('401')) {
        // Token expired or unauthorized
        router.push('/login');
      } else {
        setError(err.message || 'Failed to fetch contacts');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  // Render loading state
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
  
  // Redirect if not authenticated or no organization
  if (!user || !user.organisation_id) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-gray-600">Manage your contacts for {user.organisation_name}</p>
        </div>
        <Link 
          href="/contacts/new" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Contact
        </Link>
      </div>
      
      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center">
          <div className="relative flex-grow max-w-sm">
            <input
              type="text"
              placeholder="Search contacts..."
              value={filter}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
          </div>
          
          <button 
            onClick={fetchContacts}
            className="ml-4 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <span>↻</span> Refresh
          </button>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <div className="mt-2">
            <button 
              onClick={fetchContacts}
              className="text-sm text-red-700 hover:text-red-900 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !error && contacts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first contact.</p>
          <Link
            href="/contacts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Contact
          </Link>
        </div>
      )}
      
      {/* Contacts List */}
      {!loading && !error && contacts.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <li key={contact.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-700">👤</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-indigo-600">
                        {contact.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.email || 'No email provided'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {contact.phone && (
                      <div className="text-sm text-gray-600 hidden md:block">
                        {contact.phone}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Link 
                        href={`/contacts/${contact.id}`} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/contacts/${contact.id}/edit`} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}