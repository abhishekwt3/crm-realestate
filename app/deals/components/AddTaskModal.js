'use client';

import { useState } from 'react';

export default function AddTaskModal({ isOpen, onClose, dealId, onTaskAdded, teamMembers = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'Pending',
    assigned_to: ''
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
        throw new Error('Task title is required');
      }

      // Prepare task data for API
      const taskData = {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date || null,
        status: formData.status,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        deal_id: dealId
      };

      // Submit the task
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      // Success
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        due_date: '',
        status: 'Pending',
        assigned_to: ''
      });

      // Call callback if provided
      if (onTaskAdded) {
        onTaskAdded();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get current date in YYYY-MM-DD format for min attribute
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Modal content with shadow and no background overlay */}
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Task</h2>
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
            Task created successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter task title"
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
              placeholder="Enter task description (optional)"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              min={getCurrentDate()}
              className="form-input"
            />
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
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.team_member_name}
                </option>
              ))}
            </select>
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
              disabled={loading || !formData.title}
              className="btn"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}