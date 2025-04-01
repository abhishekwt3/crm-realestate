'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Dashboard components
const StatsCard = ({ title, value, icon, changePercent }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {changePercent && (
            <div className={`flex items-center mt-2 ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{changePercent >= 0 ? '↑' : '↓'}</span>
              <span className="ml-1 text-sm">{Math.abs(changePercent)}% from last month</span>
            </div>
          )}
        </div>
        <div className="text-3xl opacity-75">{icon}</div>
      </div>
    </div>
  );
};



const RecentActivity = ({ activities }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium">Recent Activity</h3>
      </div>
      <div className="divide-y">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-lg">{activity.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-4 text-center text-gray-500">No recent activity</div>
        )}
      </div>
    </div>
  );
};

const UpcomingMeetings = ({ meetings }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium">Upcoming Meetings</h3>
      </div>
      <div className="divide-y">
        {meetings.length > 0 ? (
          meetings.map((meeting, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{meeting.date} • {meeting.time}</p>
                </div>
                <Link href={`/meetings/${meeting.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-4 text-center text-gray-500">No upcoming meetings</div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeDeals: { value: 0, changePercent: 0 },
    totalProperties: { value: 0, changePercent: 0 },
    totalContacts: { value: 0, changePercent: 0 },
    revenue: { value: 0, changePercent: 0 }
  });

  const [authStatus, setAuthStatus] = useState({ checked: false, authenticated: false, info: null });

useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/test');
      const data = await response.json();
      
      setAuthStatus({
        checked: true,
        authenticated: data.authenticated,
        info: data
      });
      
      console.log('Auth status:', data);
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthStatus({
        checked: true,
        authenticated: false,
        error: error.message
      });
    }
  };
  
  checkAuth();
}, []);

{authStatus.checked && (
    <div className={`mb-6 p-4 rounded-lg ${authStatus.authenticated ? 'bg-green-100' : 'bg-red-100'}`}>
      <h2 className="font-medium">
        Authentication Status: {authStatus.authenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
      </h2>
      {authStatus.info && (
        <div className="mt-2 text-sm">
          <p>User: {authStatus.info.user?.email || 'Unknown'}</p>
          <p>Token source: {authStatus.info.tokenSource}</p>
          {authStatus.info.tokenExpiry && (
            <p>Token expires: {new Date(authStatus.info.tokenExpiry).toLocaleString()}</p>
          )}
        </div>
      )}
      {authStatus.error && (
        <p className="mt-2 text-sm text-red-700">{authStatus.error}</p>
      )}
    </div>
  )}
  
  const [activities, setActivities] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Would normally fetch from API
        // const response = await fetch('/api/dashboard/stats');
        // const data = await response.json();
        
        // Using mock data for demonstration
        setTimeout(() => {
          setStats({
            activeDeals: { value: 24, changePercent: 12 },
            totalProperties: { value: 156, changePercent: 8 },
            totalContacts: { value: 324, changePercent: 15 },
            revenue: { value: '$1.2M', changePercent: -3 }
          });
          
          setActivities([
            { icon: '💼', title: 'New deal created: Office Building Purchase', time: '2 hours ago' },
            { icon: '🏠', title: 'Property updated: 123 Main Street', time: '4 hours ago' },
            { icon: '📝', title: 'Note added to Downtown Apartment deal', time: '6 hours ago' },
            { icon: '👤', title: 'New contact added: John Smith', time: '1 day ago' }
          ]);
          
          setMeetings([
            { id: 1, title: 'Property Viewing - 123 Oak Street', date: 'Today', time: '2:00 PM' },
            { id: 2, title: 'Client Consultation - ABC Corp', date: 'Tomorrow', time: '10:00 AM' },
            { id: 3, title: 'Deal Negotiation - Downtown Office', date: 'Apr 3, 2025', time: '1:30 PM' }
          ]);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return <div className="p-4">Loading dashboard data...</div>;
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your CRM dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Active Deals" 
          value={stats.activeDeals.value} 
          icon="💼" 
          changePercent={stats.activeDeals.changePercent} 
        />
        <StatsCard 
          title="Total Properties" 
          value={stats.totalProperties.value} 
          icon="🏠" 
          changePercent={stats.totalProperties.changePercent} 
        />
        <StatsCard 
          title="Total Contacts" 
          value={stats.totalContacts.value} 
          icon="👥" 
          changePercent={stats.totalContacts.changePercent} 
        />
        <StatsCard 
          title="Revenue Pipeline" 
          value={stats.revenue.value} 
          icon="💰" 
          changePercent={stats.revenue.changePercent} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} />
        </div>
        <div>
          <UpcomingMeetings meetings={meetings} />
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/deals/new" className="block p-6 bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200 text-center hover:bg-indigo-100">
          <div className="text-2xl mb-2">📝</div>
          <h3 className="font-medium text-indigo-700">Create New Deal</h3>
        </Link>
        
        <Link href="/properties/new" className="block p-6 bg-green-50 rounded-lg border-2 border-dashed border-green-200 text-center hover:bg-green-100">
          <div className="text-2xl mb-2">🏠</div>
          <h3 className="font-medium text-green-700">Add New Property</h3>
        </Link>
        
        <Link href="/meetings/new" className="block p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200 text-center hover:bg-blue-100">
          <div className="text-2xl mb-2">📅</div>
          <h3 className="font-medium text-blue-700">Schedule Meeting</h3>
        </Link>
      </div>
    </div>
  );
}