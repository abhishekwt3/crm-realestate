'use client';

import { useState } from 'react';

export default function NotesTab({ 
  notes = [], 
  onAddNote, 
  isLoading = false 
}) {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notes</h2>
        <button
          onClick={onAddNote}
          className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Note
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="border-l-4 border-indigo-500 pl-4 py-2">
              <div className="flex justify-between">
                <p className="text-sm font-medium">
                  {note.teamMember?.team_member_name || 'System'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(note.timestamp)}
                </p>
              </div>
              <p className="mt-1 text-gray-700">{note.comments}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 py-6 text-center">No notes yet. Add a note to keep track of important information.</p>
      )}
    </div>
  );
}