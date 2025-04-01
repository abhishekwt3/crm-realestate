'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewOrganization() {
  const [formData, setFormData] = useState({
    organisation_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }
      
      // Redirect to organizations list
      router.push('/organizations');
    } catch (err) {
      setError(err.message);
      console.error('Error creating organization:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Organization</h1>
        <p className="text-gray-600">Create a new organization in the system</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="organisation_name" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              id="organisation_name"
              name="organisation_name"
              value={formData.organisation_name}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter organization name"
            />
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/organizations" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}