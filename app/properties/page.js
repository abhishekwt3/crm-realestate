'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        let url = '/api/properties';
        if (filter) {
          url += `?status=${filter}`;
        }
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch properties');
        }
        
        const data = await response.json();
        setProperties(data.properties || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [filter]);
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setLoading(true);
  };
  
  if (loading) {
    return <div className="p-4">Loading properties...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
          Error: {error}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-gray-600">Manage your property portfolio</p>
        </div>
        <Link href="/properties/new" className="btn">
          Add Property
        </Link>
      </div>
      
      <div className="mb-6">
        <label htmlFor="filter" className="mr-2 text-sm font-medium text-gray-700">
          Filter by Status:
        </label>
        <select
          id="filter"
          value={filter}
          onChange={handleFilterChange}
          className="form-input py-1 w-40"
        >
          <option value="">All Properties</option>
          <option value="Available">Available</option>
          <option value="Under Contract">Under Contract</option>
          <option value="Sold">Sold</option>
          <option value="Listed">Listed</option>
        </select>
      </div>
      
      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">No properties found</p>
          <Link href="/properties/new" className="btn">
            Add Property
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deals
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {property.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {property.address || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {property.owner?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${property.status === 'Available' ? 'bg-green-100 text-green-800' : 
                        property.status === 'Under Contract' ? 'bg-yellow-100 text-yellow-800' : 
                          property.status === 'Sold' ? 'bg-gray-100 text-gray-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                      {property.status || 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property._count?.deals || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/properties/${property.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      View
                    </Link>
                    <Link href={`/properties/${property.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}