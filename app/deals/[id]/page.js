'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';

export default function DealDetail({ params }) {
  const dealId = params.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Deal state
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Additional data
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('discussions');
  
  // Form states
  const [discussionForm, setDiscussionForm] = useState({ comments: '' });
  const [taskForm, setTaskForm] = useState({ 
    title: '', 
    description: '', 
    due_date: '', 
    status: 'Pending',
    assigned_to: '' 
  });
  const [meetingForm, setMeetingForm] = useState({ 
    title: '', 
    datetime: '', 
    description: '', 
    location: '',
    assigned_to: '' 
  });
  const [assignForm, setAssignForm] = useState({ 
    assigned_to: '' 
  });
  
  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  
  // Fetch deal data
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchDealData();
      fetchTeamMembers();
    }
  }, [user, authLoading, dealId, router]);
  
  // Fetch tasks when active tab changes to tasks
  useEffect(() => {
    if (activeTab === 'tasks' && deal) {
      fetchTasks();
    }
  }, [activeTab, deal]);
  
  const fetchDealData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/deals/${dealId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deal');
      }
      
      const data = await response.json();
      setDeal(data.deal);
      
      // Initialize assignment form with current assignee
      if (data.deal.assignedTo) {
        setAssignForm({ assigned_to: data.deal.assignedTo.id.toString() });
      }
    } catch (err) {
      console.error('Error fetching deal:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/team`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch team members');
      }
      
      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };
  
  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/tasks?dealId=${dealId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };
  
  // Handle form changes
  const handleDiscussionChange = (e) => {
    setDiscussionForm({ ...discussionForm, [e.target.name]: e.target.value });
  };
  
  const handleTaskChange = (e) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  };
  
  const handleMeetingChange = (e) => {
    setMeetingForm({ ...meetingForm, [e.target.name]: e.target.value });
  };
  
  const handleAssignChange = (e) => {
    setAssignForm({ ...assignForm, [e.target.name]: e.target.value });
  };
  
  // Handle form submissions
  const handleSubmitDiscussion = async (e) => {
    e.preventDefault();
    if (!discussionForm.comments.trim()) return;
    
    try {
      setSubmitting(true);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/deals/${dealId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(discussionForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add discussion');
      }
      
      // Clear the form
      setDiscussionForm({ comments: '' });
      setSuccess('Discussion added successfully');
      
      // Refresh deal data
      fetchDealData();
    } catch (err) {
      console.error('Error submitting discussion:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    
    try {
      setSubmitting(true);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...taskForm,
          deal_id: dealId,
          assigned_to: taskForm.assigned_to || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add task');
      }
      
      // Clear the form
      setTaskForm({ title: '', description: '', due_date: '', status: 'Pending', assigned_to: '' });
      setSuccess('Task added successfully');
      
      // Refresh tasks
      fetchTasks();
    } catch (err) {
      console.error('Error submitting task:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSubmitMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title.trim() || !meetingForm.datetime) return;
    
    try {
      setSubmitting(true);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/deals/${dealId}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...meetingForm,
          team_member_id: meetingForm.assigned_to || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add meeting');
      }
      
      // Clear the form
      setMeetingForm({ title: '', datetime: '', description: '', location: '', assigned_to: '' });
      setSuccess('Meeting added successfully');
      
      // Refresh deal data
      fetchDealData();
    } catch (err) {
      console.error('Error submitting meeting:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAssignDeal = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assigned_to: assignForm.assigned_to || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign deal');
      }
      
      setSuccess('Deal assigned successfully');
      
      // Refresh deal data
      fetchDealData();
    } catch (err) {
      console.error('Error assigning deal:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => fetchDealData()} 
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Try Again
        </button>
        <Link href="/deals" className="ml-4 text-indigo-600 hover:underline">
          Back to Deals
        </Link>
      </div>
    );
  }
  
  // Not found state
  if (!deal) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Deal not found</p>
        </div>
        <Link href="/deals" className="text-indigo-600 hover:underline">
          Back to Deals
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Deal Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{deal.name}</h1>
          <div className="flex items-center mt-2">
            <span className={`px-2 py-1 text-xs rounded-full mr-3 
              ${deal.status === 'New' ? 'bg-blue-100 text-blue-800' : 
                deal.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                  deal.status === 'Closed Won' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'}`}
            >
              {deal.status}
            </span>
            {deal.value && (
              <span className="text-gray-700">
                ${deal.value.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Property: {deal.property?.name || 'No property'}
            {deal.property?.address && ` - ${deal.property.address}`}
          </p>
          <p className="text-gray-600">
            Assigned to: {deal.assignedTo?.team_member_name || 'Unassigned'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href={`/deals/${dealId}/edit`} 
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Edit Deal
          </Link>
          <Link 
            href="/deals" 
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Back to Deals
          </Link>
        </div>
      </div>
      
      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{success}</p>
        </div>
      )}
      
      {/* Assign Deal Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Assign Deal</h2>
        <form onSubmit={handleAssignDeal} className="flex space-x-4">
          <div className="flex-1">
            <select
              name="assigned_to"
              value={assignForm.assigned_to}
              onChange={handleAssignChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.team_member_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Assigning...' : 'Assign'}
          </button>
        </form>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'discussions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Discussions
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'meetings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Meetings
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Discussions</h2>
            <form onSubmit={handleSubmitDiscussion} className="mb-6">
              <div className="mb-4">
                <textarea
                  name="comments"
                  value={discussionForm.comments}
                  onChange={handleDiscussionChange}
                  placeholder="Add a new comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
            
            <div className="space-y-4">
              {deal.discussions && deal.discussions.length > 0 ? (
                deal.discussions.map(discussion => (
                  <div key={discussion.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <p className="font-medium">
                        {discussion.teamMember?.team_member_name || 'Unknown User'}
                      </p>
                      <span className="text-sm text-gray-500">
                        {formatDate(discussion.timestamp)}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{discussion.comments}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No discussions yet</p>
              )}
            </div>
          </div>
        )}
        
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Tasks</h2>
            <form onSubmit={handleSubmitTask} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={taskForm.title}
                    onChange={handleTaskChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    id="due_date"
                    name="due_date"
                    value={taskForm.due_date}
                    onChange={handleTaskChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={taskForm.status}
                    onChange={handleTaskChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    value={taskForm.assigned_to}
                    onChange={handleTaskChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.team_member_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={taskForm.description}
                    onChange={handleTaskChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
            
            {/* Tasks List */}
            <h3 className="text-md font-medium mb-3 border-b pb-2">Task List</h3>
            {tasksLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tasks yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                              task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDueDate(task.due_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {task.assignedTo?.team_member_name || 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Meetings</h2>
            <form onSubmit={handleSubmitMeeting} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={meetingForm.title}
                    onChange={handleMeetingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="datetime"
                    name="datetime"
                    value={meetingForm.datetime}
                    onChange={handleMeetingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={meetingForm.location}
                    onChange={handleMeetingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    value={meetingForm.assigned_to}
                    onChange={handleMeetingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.team_member_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={meetingForm.description}
                    onChange={handleMeetingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
            
            <div className="space-y-4">
              {deal.meetings && deal.meetings.length > 0 ? (
                <>
                  <h3 className="text-md font-medium mb-3 border-b pb-2">Scheduled Meetings</h3>
                  {deal.meetings.map(meeting => (
                    <div key={meeting.id} className="border-b pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-gray-700">
                            {meeting.location && `Location: ${meeting.location}`}
                          </p>
                          {meeting.description && (
                            <p className="mt-2 text-gray-700">{meeting.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatDate(meeting.datetime)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {meeting.teamMember?.team_member_name || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">No meetings scheduled</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}