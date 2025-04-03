'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProperty({ params }) {
  const propertyId = params.id;
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner_id: '',
    status: 'Available'
  });
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  
  // Fetch property data and contacts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Fetch property
        const propertyResponse = await fetch(`/api/properties/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!propertyResponse.ok) {
          const errorData = await propertyResponse.json();
          throw new Error(errorData.error || 'Failed to fetch property');
        }
        
        const propertyData = await propertyResponse.json();
        setFormData({
          name: propertyData.property.name || '',
          address: propertyData.property.address || '',
          owner_id: propertyData.property.owner_id?.toString() || '',
          status: propertyData.property.status || 'Available'
        });
        
        // Fetch contacts
        const contactsResponse = await fetch('/api/contacts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          setContacts(contactsData.contacts || []);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [propertyId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property');
      }
      
      // Redirect to property details
      router.push(`/properties/${propertyId}`);
    } catch (err) {
      setError(err.message);
      console.error('Error updating property:', err);
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="p-4">Loading property data...</div>;
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Property</h1>
        <p className="text-gray-600">Update property information</p>
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
              Property Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
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
              className="form-input"
              placeholder="Enter property address"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 mb-1">
              Owner
            </label>
            <select
              id="owner_id"
              name="owner_id"
              value={formData.owner_id}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Select an owner (optional)</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
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
              className="form-input"
            >
              <option value="Available">Available</option>
              <option value="Under Contract">Under Contract</option>
              <option value="Sold">Sold</option>
              <option value="Listed">Listed</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <Link href={`/properties/${propertyId}`} className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}