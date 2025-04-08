'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DealList() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();
  const [debugMode, setDebugMode] = useState(false);

  // Initial data load
  useEffect(() => {
    fetchDeals();
  }, [statusFilter]);

  const fetchDeals = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Build URL with status filter if provided
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/deals`;
      
      // Add parameters to include counts and other needed data
      const params = new URLSearchParams();
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      // Request explicit count of related items
      params.append('includeCounts', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deals');
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      // Temporarily store the deals to process them further
      const fetchedDeals = data.deals || [];
      
      // Since task counts might not be included correctly, we'll fetch tasks directly
      await fetchTasksForDeals(fetchedDeals, token);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Fetch tasks for all deals to get accurate counts
  const fetchTasksForDeals = async (dealsData, token) => {
    try {
      // Process deals to ensure activity data is available
      const processedDeals = [...dealsData];
      const dealPromises = [];
      
      // Prepare requests for each deal
      for (let i = 0; i < processedDeals.length; i++) {
        const deal = processedDeals[i];
        dealPromises.push(fetchActivityDataForDeal(deal.id, token));
      }
      
      // Execute all requests in parallel
      const activityResults = await Promise.all(dealPromises);
      
      // Update each deal with its activity data
      for (let i = 0; i < processedDeals.length; i++) {
        const deal = processedDeals[i];
        const activityData = activityResults[i];
        
        // Create or update the _count object with activity data
        deal._count = {
          // Keep existing counts if available
          ...(deal._count || {}),
          // Add activity data with fallbacks
          tasks: activityData.tasks || 0,
          meetings: activityData.meetings || 0,
          discussions: activityData.discussions || 0
        };
      }
      
      // Update state with processed deals
      setDeals(processedDeals);
      console.log("Processed deals with activity data:", processedDeals);
    } catch (error) {
      console.error("Error processing deal activity data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch activity data for a single deal
  const fetchActivityDataForDeal = async (dealId, token) => {
    try {
      // Create object to store activity counts
      const activityData = {
        tasks: 0,
        meetings: 0,
        discussions: 0
      };
      
      // Fetch tasks for this deal
      const tasksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/tasks?dealId=${dealId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        activityData.tasks = tasksData.tasks?.length || 0;
      }
      
      // Fetch meetings for this deal
      const meetingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/deals/${dealId}/meetings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (meetingsResponse.ok) {
        const meetingsData = await meetingsResponse.json();
        activityData.meetings = meetingsData.meetings?.length || 0;
      }
      
      // Fetch discussions for this deal
      const discussionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/deals/${dealId}/discussions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (discussionsResponse.ok) {
        const discussionsData = await discussionsResponse.json();
        activityData.discussions = discussionsData.discussions?.length || 0;
      }
      
      return activityData;
    } catch (error) {
      console.error(`Error fetching activity data for deal ${dealId}:`, error);
      return { tasks: 0, meetings: 0, discussions: 0 };
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleDealClick = (dealId) => {
    router.push(`/deals/${dealId}`);
  };

  // Manually refresh deals
  const handleRefresh = () => {
    fetchDeals();
  };
  
  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // Activity chart component (GitHub-style)
  const ActivityChart = ({ deal }) => {
    // Get counts from deal data
    const tasksCount = deal._count?.tasks || 0;
    const meetingsCount = deal._count?.meetings || 0;
    const discussionsCount = deal._count?.discussions || 0;
    
    // Calculate total activity
    const totalActivity = tasksCount + meetingsCount + discussionsCount;
    
    // SVG dimensions
    const width = 120;
    const height = 30;
    const padding = 2;
    
    // Number of data points
    const numPoints = 10;
    
    // Generate random-looking but deterministic data 
    // (based on deal ID and activity count to ensure consistent display)
    const getActivityData = () => {
      // If no activity, return flat line
      if (totalActivity === 0) {
        return Array(numPoints).fill(1);
      }
      
      // Use deal.id as seed for consistent randomization
      const seed = parseInt(deal.id) || 0;
      
      return Array(numPoints).fill(0).map((_, i) => {
        // Generate pseudo-random but deterministic value
        let val = ((seed + i * 7) % 10) + 1;
        
        // Scale it based on activity level
        val = (val * Math.min(totalActivity, 10)) / 10;
        
        // Ensure some minimum height
        return Math.max(val, 1);
      });
    };
    
    const activityData = getActivityData();
    
    // Calculate X and Y scales
    const xStep = (width - padding * 2) / (numPoints - 1);
    const maxDataPoint = Math.max(...activityData, 1);
    const yScale = (height - padding * 2) / maxDataPoint;
    
    // Create SVG path
    let path = `M ${padding},${height - padding}`;
    
    // Add flat line if no activity
    if (totalActivity === 0) {
      path += ` L ${width - padding},${height - padding}`;
    } else {
      // Add path points
      activityData.forEach((point, i) => {
        const x = padding + i * xStep;
        const y = height - padding - point * yScale;
        path += ` L ${x},${y}`;
      });
      
      // Add final point connecting to the bottom right
      path += ` L ${width - padding},${height - padding}`;
    }
    
    // Determine color intensity based on activity level
    let fillOpacity = 0.1;
    let strokeColor = '#2da44e'; // GitHub green color
    
    if (totalActivity > 3) {
      fillOpacity = 0.2;
    }
    if (totalActivity > 7) {
      fillOpacity = 0.3;
    }
    
    return (
      <div className="flex flex-col">
        <svg width={width} height={height}>
          {/* Fill area under the curve */}
          <path d={path} fill={strokeColor} fillOpacity={fillOpacity} />
          
          {/* Stroke line on top */}
          <path 
            d={path}
            stroke={strokeColor}
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        
        <div className="text-sm text-gray-500 mt-1">
          {totalActivity} {totalActivity === 1 ? 'action' : 'actions'}
        </div>
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
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
            onClick={fetchDeals}
            className="text-sm text-red-700 hover:text-red-900 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (deals.length === 0) {
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Deals</h2>
          <Link href="/deals/new" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            New Deal
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center">
          <label htmlFor="statusFilter" className="font-medium text-gray-700 mr-2">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md mr-4"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-500 mb-6">
            {statusFilter 
              ? `No deals with status "${statusFilter}" found` 
              : "Get started by adding your first deal."
            }
          </p>
          <Link href="/deals/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Add Deal
          </Link>
        </div>
      </div>
    );
  }

  // Render the deal list
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Deals</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <Link href="/deals/new" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            New Deal
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap items-center">
        <label htmlFor="statusFilter" className="font-medium text-gray-700 mr-2">
          Filter by Status:
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-gray-300 rounded-md mr-4"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed Won">Closed Won</option>
          <option value="Closed Lost">Closed Lost</option>
        </select>
        
        <span className="ml-auto text-gray-500">
          {deals.length} deal{deals.length !== 1 ? 's' : ''} found
        </span>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
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
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr 
                  key={deal.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleDealClick(deal.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {deal.name}
                    </div>
                    {debugMode && (
                      <div className="text-xs text-gray-500">
                        T: {deal._count?.tasks || 0} | 
                        M: {deal._count?.meetings || 0} | 
                        D: {deal._count?.discussions || 0}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {deal.property?.name || 'No property'}
                    </div>
                    {deal.property?.address && (
                      <div className="text-xs text-gray-500">
                        {deal.property.address}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${deal.status === 'New' ? 'bg-blue-100 text-blue-800' : 
                        deal.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                          deal.status === 'Closed Won' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}
                    >
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.assignedTo?.team_member_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActivityChart deal={deal} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      href={`/deals/${deal.id}`} 
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                    <Link 
                      href={`/deals/${deal.id}/edit`} 
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Debug mode toggle */}
      <div className="flex justify-end mt-4">
        <button
          onClick={toggleDebugMode}
          className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
        >
          {debugMode ? 'Hide Debug' : 'Debug Mode'}
        </button>
      </div>
      
      {/* Debug information */}
      {debugMode && (
        <div className="mt-2 p-4 bg-gray-100 rounded-md">
          <h3 className="text-sm font-semibold mb-2">Activity Counts</h3>
          <div className="grid grid-cols-3 gap-4">
            {deals.map(deal => (
              <div key={deal.id} className="bg-white p-2 rounded border">
                <p className="text-xs font-medium">{deal.name}</p>
                <p className="text-xs">Tasks: {deal._count?.tasks || 0}</p>
                <p className="text-xs">Meetings: {deal._count?.meetings || 0}</p>
                <p className="text-xs">Discussions: {deal._count?.discussions || 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}