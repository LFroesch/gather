import { Calendar, MapPin, Users, Clock, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistance } from '../lib/utils';

const EventCard = ({ event, showRSVPStatus = false }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="card-title text-lg">{event.title}</h3>
              <div className={`badge ${getCategoryColor(event.category)}`}>
                {event.category}
              </div>
              {event.isPrivate && (
                <div className="badge badge-warning gap-1">
                  <Lock className="w-3 h-3" />
                  Invite Only
                </div>
              )}
              {showRSVPStatus && (
                <div className="badge badge-success">
                  Attending
                </div>
              )}
            </div>
            
            <p className="text-base-content/70 mb-3 line-clamp-2">
              {event.description}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(event.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{event.location.city}, {event.location.state}</span>
                {event.distanceInMiles !== undefined && event.distanceInMiles > 0 && (
                  <span className="text-primary">
                    ({formatDistance(event.distanceInMiles)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{event.attendeeCount || 0} attending</span>
              </div>
            </div>

            {event.location.venue && (
              <div className="mt-2 text-sm text-base-content/60">
                📍 {event.location.venue}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img 
                    src={event.creator.profilePic || '/avatar.png'} 
                    alt={event.creator.fullName}
                  />
                </div>
              </div>
              <span className="text-sm text-base-content/60">
                Created by {event.creator.fullName}
              </span>
            </div>
          </div>

          {event.image && (
            <div className="ml-4">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="card-actions justify-end mt-4">
          <Link 
            to={`/events/${event._id}`}
            className="btn btn-primary btn-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;