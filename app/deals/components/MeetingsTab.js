'use client';

export default function MeetingsTab({
  meetings = [],
  onScheduleMeeting,
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
        <h2 className="text-xl font-semibold">Meetings</h2>
        <button
          onClick={onScheduleMeeting}
          className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Schedule Meeting
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : meetings && meetings.length > 0 ? (
        <div className="space-y-4">
          {meetings.map(meeting => (
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
        <p className="text-gray-500 py-6 text-center">No meetings scheduled yet.</p>
      )}
    </div>
  );
}