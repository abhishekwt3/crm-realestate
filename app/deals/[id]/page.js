'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';
import AddNoteModal from '../components/AddNoteModal';
import ScheduleMeetingModal from '../components/ScheduleMeetingModal';
import UploadDocumentModal from '../components/UploadDocumentModal';
import AddTaskModal from '../components/AddTaskModal';

export default function DealDetails() {
  // Use the useParams hook to get route parameters
  const params = useParams();
  const dealId = params.id;
  
  const { user } = useAuth();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isScheduleMeetingModalOpen, setIsScheduleMeetingModalOpen] = useState(false);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    property_id: '',
    assigned_to: '',
    status: '',
    value: ''
  });
  const [properties, setProperties] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  useEffect(() => {
    fetchDealDetails();
  }, [dealId]);
  
  const fetchDealDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Fetch deal details
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/deals/${dealId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deal details');
      }
      
      const data = await response.json();
      setDeal(data.deal);
      
      // Initialize edit form with deal data
      setEditFormData({
        name: data.deal.name || '',
        property_id: data.deal.property_id?.toString() || '',
        assigned_to: data.deal.assigned_to?.toString() || '',
        status: data.deal.status || 'New',
        value: data.deal.value?.toString() || ''
      });
      
      // Fetch properties and team members for the edit form
      if (user && user.organisation_id) {
        fetchPropertiesAndTeamMembers(token);
        fetchTasks(token);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching deal details:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPropertiesAndTeamMembers = async (token) => {
    try {
      // Fetch properties
      const propertiesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        setProperties(propertiesData.properties || []);
      }
      
      // Fetch team members
      const teamResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/team`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData.teamMembers || []);
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };
  
  const fetchTasks = async (token) => {
    try {
      // Fetch tasks related to this deal
      const tasksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/tasks?dealId=${dealId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };
  
  const handleEditModalOpen = () => {
    setIsEditModalOpen(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };
  
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Prepare form data
      const formData = {
        ...editFormData,
        property_id: editFormData.property_id ? parseInt(editFormData.property_id) : null,
        assigned_to: editFormData.assigned_to ? parseInt(editFormData.assigned_to) : null,
        value: editFormData.value ? parseFloat(editFormData.value) : null
      };
      
      // Update deal
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update deal');
      }
      
      // Refresh deal data
      fetchDealDetails();
      setUpdateSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        setIsEditModalOpen(false);
        setUpdateSuccess(false);
      }, 1500);
    } catch (err) {
      setUpdateError(err.message);
      console.error('Error updating deal:', err);
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal?')) {
      return;
    }
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/deals/${dealId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete deal');
      }
      
      // Redirect to deals list
      router.push('/deals');
    } catch (err) {
      setError(err.message);
      console.error('Error deleting deal:', err);
    }
  };
  
  // Handler for note added
  const handleNoteAdded = () => {
    fetchDealDetails(); // Refresh the deal details to show the new note
  };
  
  // Handler for meeting added
  const handleMeetingAdded = () => {
    fetchDealDetails(); // Refresh the deal details to show the new meeting
  };
  
  // Handler for document uploaded
  const handleDocumentUploaded = () => {
    fetchDealDetails(); // Refresh the deal details
  };
  
  // Handler for task added
  const handleTaskAdded = () => {
    fetchDealDetails(); // Refresh the deal details
    fetchTasks(localStorage.getItem('token')); // Refresh tasks
  };
  
  // Formatting helper
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };
  
  if (loading) {
    return <div className="p-4">Loading deal details...</div>;
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
  
  if (!deal) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 p-4 rounded-md text-yellow-700 mb-4">
          Deal not found
        </div>
        <Link href="/deals" className="btn-secondary">
          Back to Deals
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{deal.name}</h1>
          <p className="text-gray-600">
            {deal.property ? (
              <Link href={`/properties/${deal.property.id}`} className="text-indigo-600 hover:text-indigo-900">
                {deal.property.name}
              </Link>
            ) : (
              'No property assigned'
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleEditModalOpen} 
            className="btn-secondary"
          >
            Edit Deal
          </button>
          <button onClick={handleDelete} className="btn bg-red-600 hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Deal Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${deal.status === 'New' ? 'bg-blue-100 text-blue-800' : 
                      deal.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                        deal.status === 'Closed Won' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}>
                    {deal.status}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Value</p>
                <p className="mt-1">{formatCurrency(deal.value)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned To</p>
                <p className="mt-1">{deal.assignedTo?.team_member_name || 'Unassigned'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="mt-1">
                  {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="mt-1">
                  {deal.updated_at ? new Date(deal.updated_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => setIsAddNoteModalOpen(true)} 
                className="btn w-full text-center block"
              >
                Add Note
              </button>
              <button 
                onClick={() => setIsScheduleMeetingModalOpen(true)} 
                className="btn-secondary w-full text-center block"
              >
                Schedule Meeting
              </button>
              <button 
                onClick={() => setIsAddTaskModalOpen(true)} 
                className="btn-secondary w-full text-center block"
              >
                Add Task
              </button>
              <button 
                onClick={() => setIsUploadDocumentModalOpen(true)} 
                className="btn-secondary w-full text-center block"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Notes</h2>
          <button
            onClick={() => setIsAddNoteModalOpen(true)}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            + Add Note
          </button>
        </div>
        
        {deal.notes && deal.notes.length > 0 ? (
          <div className="space-y-4">
            {deal.notes.map(note => (
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
          <p className="text-gray-500">No notes yet. Add a note to keep track of important information.</p>
        )}
      </div>
      
      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            + Add Task
          </button>
        </div>
        
        {tasks && tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.assignedTo?.team_member_name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No tasks yet. Add a task to track action items for this deal.</p>
        )}
      </div>
      
      {/* Meetings Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Meetings</h2>
          <button
            onClick={() => setIsScheduleMeetingModalOpen(true)}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            + Schedule Meeting
          </button>
        </div>
        
        {deal.meetings && deal.meetings.length > 0 ? (
          <div className="space-y-4">
            {deal.meetings.map(meeting => (
              <div key={meeting.id} className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{meeting.title || 'Untitled Meeting'}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(meeting.datetime)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {meeting.teamMember?.team_member_name || 'Unassigned'}
                  </span>
                </div>
                {meeting.location && (
                  <p className="text-sm mt-2">
                    <span className="font-medium">Location:</span> {meeting.location}
                  </p>
                )}
                {meeting.description && (
                  <p className="text-sm mt-2">{meeting.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No meetings scheduled yet.</p>
        )}
      </div>
      
      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          <button
            onClick={() => setIsUploadDocumentModalOpen(true)}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            + Upload Document
          </button>
        </div>
        
        <p className="text-gray-500">No documents uploaded yet.</p>
      </div>
      
      {/* Edit Deal Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Modal content with shadow and no backdrop */}
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Deal</h2>
              <button
                onClick={handleEditModalClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {updateError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {updateError}
              </div>
            )}
            
            {updateSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                Deal updated successfully!
              </div>
            )}
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Property
                </label>
                <select
                  id="property_id"
                  name="property_id"
                  value={editFormData.property_id}
                  onChange={handleEditChange}
                  className="form-input"
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={editFormData.assigned_to}
                  onChange={handleEditChange}
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
              
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditChange}
                  className="form-input"
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Value
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={editFormData.value}
                  onChange={handleEditChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="Enter deal value"
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={handleEditModalClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="btn"
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        dealId={dealId}
        onNoteAdded={handleNoteAdded}
      />
      
      <ScheduleMeetingModal
        isOpen={isScheduleMeetingModalOpen}
        onClose={() => setIsScheduleMeetingModalOpen(false)}
        dealId={dealId}
        onMeetingAdded={handleMeetingAdded}
        teamMembers={teamMembers}
      />
      
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        dealId={dealId}
        onTaskAdded={handleTaskAdded}
        teamMembers={teamMembers}
      />
      
      <UploadDocumentModal
        isOpen={isUploadDocumentModalOpen}
        onClose={() => setIsUploadDocumentModalOpen(false)}
        dealId={dealId}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}