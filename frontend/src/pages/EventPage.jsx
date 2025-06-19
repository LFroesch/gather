import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User, 
  UserPlus,
  Share,
  Edit,
  Trash2
} from 'lucide-react';
import { useEventStore } from '../store/useEventStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useLocationStore } from '../store/useLocationStore';
import { formatDistance } from '../lib/utils';
import ShareModal from '../components/ShareModal';
import EditEventModal from '../components/EditEventModal';
import toast from 'react-hot-toast';

const EventPage = () => {
  const { eventId } = useParams();
  const { authUser } = useAuthStore();
  const { users, getUsers } = useChatStore();
  const { currentLocation, getLocationSettings } = useLocationStore();
  const { 
    selectedEvent, 
    getEvent, 
    rsvpToEvent, 
    inviteToEvent, 
    deleteEvent,
    updateEvent,
    isLoading 
  } = useEventStore();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [eventDistance, setEventDistance] = useState(null);

  useEffect(() => {
    if (eventId) {
      getEvent(eventId);
      getUsers(); // For invite functionality
      getLocationSettings(); // Get current location for distance calculation
    }
  }, [eventId, getEvent, getUsers, getLocationSettings]);

  useEffect(() => {
    if (selectedEvent && currentLocation?.coordinates) {
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      if (selectedEvent.location?.coordinates && currentLocation.coordinates) {
        const [eventLng, eventLat] = selectedEvent.location.coordinates;
        const [currentLng, currentLat] = currentLocation.coordinates;
        
        if (eventLng && eventLat && currentLng && currentLat) {
          const distance = calculateDistance(currentLat, currentLng, eventLat, eventLng);
          setEventDistance(distance);
        }
      }
    }
  }, [selectedEvent, currentLocation]);

  const handleRSVP = async (status) => {
    try {
      await rsvpToEvent(eventId, status);
    } catch (error) {
      console.error('RSVP failed:', error);
    }
  };

  const handleInvite = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to invite');
      return;
    }

    try {
      await inviteToEvent(eventId, selectedUser);
      setShowInviteModal(false);
      setSelectedUser('');
    } catch (error) {
      console.error('Invite failed:', error);
    }
  };

  const handleEdit = async (eventData) => {
    try {
      await updateEvent(eventId, eventData);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        toast.success('Event deleted successfully');
        // Redirect to home page
        window.location.href = '/';
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      social: 'badge-primary',
      professional: 'badge-secondary',
      educational: 'badge-accent',
      entertainment: 'badge-info',
      sports: 'badge-success',
      other: 'badge-neutral'
    };
    return colors[category] || 'badge-neutral';
  };

  const getRSVPColor = (status) => {
    const colors = {
      yes: 'btn-success',
      no: 'btn-error',
      maybe: 'btn-warning'
    };
    return colors[status] || 'btn-outline';
  };

  if (isLoading || !selectedEvent) {
    return (
      <div className="min-h-screen bg-base-200 pt-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-base-100 rounded-xl shadow-lg p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-base-300 rounded w-3/4"></div>
              <div className="h-4 bg-base-300 rounded w-1/2"></div>
              <div className="h-32 bg-base-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const event = selectedEvent;
  // Better RSVP status detection - check attendees array first
  const userAttendee = event.attendees?.find(attendee => 
    (attendee.user._id || attendee.user) === authUser._id
  );
  const userRSVP = userAttendee ? userAttendee.status : 'no';
  const isCreator = event.creator._id === authUser._id;
  const isAttending = userRSVP === 'yes';

  return (
    <div className="min-h-screen bg-base-200 pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Event Header */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          {event.image && (
            <img 
              src={event.image} 
              alt={event.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className={`badge ${getCategoryColor(event.category)}`}>
                  {event.category}
                </div>
              </div>

              <p className="text-base-content/80 text-lg mb-4">{event.description}</p>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{formatDate(event.date)}</div>
                      <div className="text-sm text-base-content/60">
                        {formatTime(event.date)}
                        {event.endDate && ` - ${formatTime(event.endDate)}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">
                        {event.location.city}, {event.location.state}
                        {eventDistance > 0 && (
                          <span className="text-primary ml-2"> ({formatDistance(eventDistance)})</span>
                        )}
                      </div>
                      {event.location.venue && (
                        <div className="text-sm text-base-content/60">
                          {event.location.venue}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{event.attendeeCount} attending</div>
                      {event.maxAttendees && (
                        <div className="text-sm text-base-content/60">
                          {event.maxAttendees - event.attendeeCount} spots left
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">Created by</div>
                      <Link 
                        to={`/profile/${event.creator.username}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {event.creator.fullName}
                      </Link>
                    </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <span key={index} className="badge badge-outline">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isCreator && (
              <>
                <button
                  className={`btn ${getRSVPColor('yes')} ${userRSVP === 'yes' ? '' : 'btn-outline'}`}
                  onClick={() => handleRSVP('yes')}
                >
                  {userRSVP === 'yes' ? '✓ Attending' : 'Attend'}
                </button>
                <button
                  className={`btn ${getRSVPColor('maybe')} ${userRSVP === 'maybe' ? '' : 'btn-outline'}`}
                  onClick={() => handleRSVP('maybe')}
                >
                  {userRSVP === 'maybe' ? '✓ Maybe' : 'Maybe'}
                </button>
                <button
                  className={`btn ${getRSVPColor('no')} ${userRSVP === 'no' ? '' : 'btn-outline'}`}
                  onClick={() => handleRSVP('no')}
                >
                  {userRSVP === 'no' ? '✓ Not Going' : 'Can\'t Go'}
                </button>
              </>
            )}

            {(isCreator || isAttending) && (
              <button
                className="btn btn-outline"
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </button>
            )}

            <button 
              className="btn btn-outline"
              onClick={() => setShowShareModal(true)}
            >
              <Share className="w-4 h-4" />
              Share
            </button>

            {isCreator && (
              <>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  className="btn btn-error btn-outline"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Attendees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.attendees
                .filter(attendee => attendee.status === 'yes')
                .map((attendee) => (
                  <div key={attendee.user._id} className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img 
                          src={attendee.user.profilePic || '/avatar.png'} 
                          alt={attendee.user.fullName}
                        />
                      </div>
                    </div>
                    <div>
                      <Link 
                        to={`/profile/${attendee.user.username}`}
                        className="font-medium hover:text-primary"
                      >
                        {attendee.user.fullName}
                      </Link>
                      <div className="text-sm text-base-content/60">
                        @{attendee.user.username}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          event={event}
          onUpdate={handleEdit}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          eventId={eventId}
          eventTitle={event.title}
        />

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Invite Someone</h3>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Select a user to invite</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Choose a user...</option>
                  {users
                    .filter(user => user._id !== authUser._id)
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName} (@{user.username})
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-action">
                <button 
                  className="btn btn-primary"
                  onClick={handleInvite}
                  disabled={!selectedUser}
                >
                  Send Invite
                </button>
                <button 
                  className="btn"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventPage;