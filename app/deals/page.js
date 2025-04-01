'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    assignedTo: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch('/api/team', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch team members');
        }
        
        const data = await response.json();
        setTeamMembers(data.teamMembers || []);
      } catch (err) {
        console.error('Error fetching team members:', err);
      }
    };
    
    fetchTeamMembers();
  }, []);
  
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Build URL with filters
        let url = '/api/deals';
        const params = new URLSearchParams();
        
        if (filters.status) {
          params.append('status', filters.status);
        }
        
        if (filters.assignedTo) {
          params.append('assignedTo', filters.assignedTo);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch deals');
        }
        
        const data = await response.json();
        setDeals(data.deals || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching deals:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeals();
  }, [filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setLoading(true);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (loading) {
    return <div className="p-4">Loading deals...</div>;
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
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-gray-600">Manage your deals and pipeline</p>
        </div>
        <Link href="/deals/new" className="btn">
          New Deal
        </Link>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="form-input py-1 w-40"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
            Assigned To
          </label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={filters.assignedTo}
            onChange={handleFilterChange}
            className="form-input py-1 w-40"
          >
            <option value="">All Team Members</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.team_member_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {deals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">No deals found</p>
          <Link href="/deals/new" className="btn">
            Create Deal
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {deal.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {deal._count.notes} notes • {deal._count.meetings} meetings
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {deal.property?.name || '-'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {deal.property?.address || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${deal.status === 'New' ? 'bg-blue-100 text-blue-800' : 
                        deal.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                          deal.status === 'Closed Won' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {deal.assignedTo?.team_member_name || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/deals/${deal.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      View
                    </Link>
                    <Link href={`/deals/${deal.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
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