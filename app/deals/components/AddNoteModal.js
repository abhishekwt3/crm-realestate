'use client';

import { useState } from 'react';

export default function AddNoteModal({ isOpen, onClose, dealId, onNoteAdded }) {
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setNoteText(e.target.value);
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
      if (!noteText.trim()) {
        throw new Error('Note text is required');
      }

      // Submit the note
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/deals/${dealId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comments: noteText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add note');
      }

      // Success
      setSuccess(true);
      setNoteText('');
      
      // Call callback if provided
      if (onNoteAdded) {
        onNoteAdded();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error('Error adding note:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Modal content with shadow and no background overlay */}
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Note</h2>
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
            Note added successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="noteText" className="block text-sm font-medium text-gray-700 mb-1">
              Note *
            </label>
            <textarea
              id="noteText"
              name="noteText"
              value={noteText}
              onChange={handleChange}
              required
              rows={5}
              className="form-input"
              placeholder="Enter your note here..."
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
              disabled={loading || !noteText.trim()}
              className="btn"
            >
              {loading ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}