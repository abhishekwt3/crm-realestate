'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';
import apiClient from '../../lib/apiClient';

export default function Properties() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState([]);
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

    // Fetch properties if authenticated
    if (user) {
      fetchProperties();
    }
  }, [user, authLoading, router, filter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Fetch properties using apiClient
      const data = await apiClient.getProperties({ status: filter });
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-gray-600">Manage your property portfolio</p>
        </div>
        <Link href="/properties/new" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Add Property
        </Link>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4">
          <label htmlFor="statusFilter" className="font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={filter}
            onChange={handleFilterChange}
            className="form-select rounded-md border-gray-300 shadow-sm mt-1 block"
          >
            <option value="">All Properties</option>
            <option value="Available">Available</option>
            <option value="Under Contract">Under Contract</option>
            <option value="Sold">Sold</option>
            <option value="Listed">Listed</option>
          </select>
          
          <button 
            onClick={fetchProperties}
            className="ml-auto px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <span>↻</span> Refresh
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {/* Error state */}
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
              onClick={fetchProperties}
              className="text-sm text-red-700 hover:text-red-900 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && !error && properties.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first property.</p>
          <Link
            href="/properties/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Property
          </Link>
        </div>
      )}
      
      {/* Properties list */}
      {!loading && !error && properties.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {properties.map((property) => (
              <li key={property.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-700">🏠</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-indigo-600">
                          {property.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {property.address || 'No address provided'}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${property.status === 'Available' ? 'bg-green-100 text-green-800' : 
                          property.status === 'Under Contract' ? 'bg-yellow-100 text-yellow-800' : 
                            property.status === 'Sold' ? 'bg-gray-100 text-gray-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                        {property.status || 'Available'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span>Owner: {property.owner?.name || 'No owner'}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm sm:mt-0 space-x-4">
                      <Link href={`/properties/${property.id}`} className="text-indigo-600 hover:text-indigo-900">
                        View
                      </Link>
                      <Link href={`/properties/${property.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
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