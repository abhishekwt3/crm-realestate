'use client';

import { useState } from 'react';

export default function ScheduleMeetingModal({ isOpen, onClose, dealId, onMeetingAdded, teamMembers = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Validate input
      if (!formData.title) {
        throw new Error('Meeting title is required');
      }

      if (!formData.datetime) {
        throw new Error('Meeting date and time are required');
      }

      // Submit the meeting
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/deals/${dealId}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule meeting');
      }

      // Success
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        datetime: '',
        location: '',
        description: ''
      });

      // Call callback if provided
      if (onMeetingAdded) {
        onMeetingAdded();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error('Error scheduling meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get current datetime in local ISO format for min attribute
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Modal content with shadow and no background overlay */}
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Schedule Meeting</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Meeting scheduled successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter meeting title"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              id="datetime"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
              required
              min={getCurrentDateTime()}
              className="form-input"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter meeting location (optional)"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="form-input"
              placeholder="Enter meeting description (optional)"
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.datetime}
              className="btn"
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}