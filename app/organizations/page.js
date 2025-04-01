'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch('/api/organizations', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch organizations');
        }
        
        const data = await response.json();
        setOrganizations(data.organisations || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching organizations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizations();
  }, []);
  
  if (loading) {
    return <div className="p-4">Loading organizations...</div>;
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
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-gray-600">Manage your organizations</p>
        </div>
        <Link href="/organizations/new" className="btn">
          Add Organization
        </Link>
      </div>
      
      {organizations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">No organizations found</p>
          <Link href="/organizations/new" className="btn">
            Create Organization
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
                  Team Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {org.organisation_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {org._count?.teamMembers || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {org._count?.properties || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/organizations/${org.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      View
                    </Link>
                    <Link href={`/organizations/${org.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
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