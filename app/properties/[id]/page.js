'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PropertyDetails({ params }) {
  const propertyId = params.id;
  const [property, setProperty] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Fetch property details
        const propertyResponse = await fetch(`/api/properties/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!propertyResponse.ok) {
          const errorData = await propertyResponse.json();
          throw new Error(errorData.error || 'Failed to fetch property details');
        }
        
        const propertyData = await propertyResponse.json();
        setProperty(propertyData.property);
        
        // Fetch deals associated with this property
        const dealsResponse = await fetch(`/api/deals?property_id=${propertyId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (dealsResponse.ok) {
          const dealsData = await dealsResponse.json();
          setDeals(dealsData.deals || []);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching property details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyDetails();
  }, [propertyId]);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete property');
      }
      
      // Redirect to properties list
      router.push('/properties');
    } catch (err) {
      setError(err.message);
      console.error('Error deleting property:', err);
    }
  };
  
  if (loading) {
    return <div className="p-4">Loading property details...</div>;
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
  
  if (!property) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 p-4 rounded-md text-yellow-700 mb-4">
          Property not found
        </div>
        <Link href="/properties" className="btn-secondary">
          Back to Properties
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <p className="text-gray-600">{property.address || 'No address provided'}</p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/properties/${propertyId}/edit`} className="btn-secondary">
            Edit Property
          </Link>
          <button onClick={handleDelete} className="btn bg-red-600 hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${property.status === 'Available' ? 'bg-green-100 text-green-800' : 
                      property.status === 'Under Contract' ? 'bg-yellow-100 text-yellow-800' : 
                        property.status === 'Sold' ? 'bg-gray-100 text-gray-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                    {property.status || 'Available'}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Owner</p>
                <p className="mt-1">{property.owner?.name || 'No owner assigned'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Organization</p>
                <p className="mt-1">{property.organisation?.organisation_name || '-'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="mt-1">
                  {property.created_at ? new Date(property.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <Link href={`/deals/new?property_id=${propertyId}`} className="btn w-full text-center block">
                Create Deal
              </Link>
              <Link href={`/documents/upload?property_id=${propertyId}`} className="btn-secondary w-full text-center block">
                Upload Document
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Associated Deals</h2>
        
        {deals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">No deals associated with this property yet</p>
            <Link href={`/deals/new?property_id=${propertyId}`} className="btn">
              Create Deal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deal Name
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
                      {deal.value ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0
                      }).format(deal.value) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {deal.assignedTo?.team_member_name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/deals/${deal.id}`} className="text-indigo-600 hover:text-indigo-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}