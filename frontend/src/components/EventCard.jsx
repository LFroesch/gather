import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import ReportButton from './ReportButton';
import { Link } from 'react-router-dom';
import { formatDistance } from '../lib/utils';

const EventCard = ({ event, showRSVPStatus = false }) => {
  const isPast = new Date(event.date) < new Date();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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
      concert: 'badge-warning',
      food: 'badge-secondary',
      nightlife: 'badge-accent',
      community: 'badge-info',
      other: 'badge-neutral'
    };
    return colors[category] || 'badge-neutral';
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [event.location.venue, event.location.city, event.location.state].filter(Boolean).join(', ')
  )}`;

  const shortLocation = event.location.venue
    ? `${event.location.venue}, ${event.location.city}`
    : `${event.location.city}, ${event.location.state}`;

  if (!event.creator) return null;

  // ── Card WITH image ── image top, info below ──
  if (event.image) {
    return (
      <div className="card card-lift bg-base-100 shadow-md overflow-hidden">
        <Link to={`/events/${event._id}`} className="block">
          <div className="h-56 overflow-hidden">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          </div>
        </Link>

        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link to={`/events/${event._id}`} className="hover:text-primary transition-colors">
              <h3 className="font-bold text-base-content text-lg leading-tight">{event.title}</h3>
            </Link>
            <span className={`badge badge-sm font-medium ${getCategoryColor(event.category)}`}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
            {event.isDemo && <span className="badge badge-sm badge-ghost text-base-content/40">Sample</span>}
            {isPast && <span className="badge badge-sm badge-error">Ended</span>}
            {showRSVPStatus && <span className="badge badge-sm badge-success">Attending</span>}
          </div>

          <p className="text-sm text-base-content/70 line-clamp-2">{event.description}</p>

          <div className="flex items-center justify-between">
            <Link
              to={`/profile/${event.creator.username}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img src={event.creator.profilePic || '/avatar.png'} alt={event.creator.fullName} />
                </div>
              </div>
              <div>
                <span className="font-semibold text-xs leading-tight">{event.creator.fullName}</span>
                <div className="text-xs text-base-content/50">@{event.creator.username}</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ReportButton contentType="event" contentId={event._id} />
              <Link to={`/events/${event._id}`} className="btn btn-primary btn-xs">View</Link>
            </div>
          </div>
        </div>

        {/* Footer banner */}
        <div className="bg-primary/10 px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <MapPin className="w-4 h-4" />
            {shortLocation}
          </a>
          {event.distanceInMiles !== undefined && event.distanceInMiles > 0 && (
            <span className="text-xs text-base-content/50">{formatDistance(event.distanceInMiles)} away</span>
          )}
          <span className="flex items-center gap-1 text-xs text-base-content/50 ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(event.date)} · {formatTime(event.date)}
          </span>
          <span className="flex items-center gap-1 text-xs text-base-content/50">
            <Users className="w-3.5 h-3.5" />
            {event.attendeeCount || 0}
          </span>
        </div>
      </div>
    );
  }

  // ── Card WITHOUT image ── date accent + compact row ──
  const eventDate = new Date(event.date);
  const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = eventDate.getDate();

  return (
    <div className="card card-lift bg-base-100 shadow-md overflow-hidden">
      <div className="flex">
        {/* Date block */}
        <div className="flex flex-col items-center justify-center bg-primary/10 px-5 py-4 border-r border-base-300">
          <span className="text-xs font-bold text-primary tracking-wide">{monthShort}</span>
          <span className="text-2xl font-extrabold text-primary leading-none">{dayNum}</span>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-3 flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link to={`/events/${event._id}`} className="hover:text-primary transition-colors">
              <h3 className="font-bold text-base-content text-base leading-tight">{event.title}</h3>
            </Link>
            <span className={`badge badge-sm font-medium ${getCategoryColor(event.category)}`}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
            {event.isDemo && <span className="badge badge-sm badge-ghost text-base-content/40">Sample</span>}
            {isPast && <span className="badge badge-sm badge-error">Ended</span>}
            {showRSVPStatus && <span className="badge badge-sm badge-success">Attending</span>}
          </div>

          <p className="text-sm text-base-content/60 line-clamp-1">{event.description}</p>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <MapPin className="w-4 h-4" />
              {shortLocation}
            </a>
            {event.distanceInMiles !== undefined && event.distanceInMiles > 0 && (
              <span className="text-xs text-base-content/50">{formatDistance(event.distanceInMiles)} away</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link
              to={`/profile/${event.creator.username}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img src={event.creator.profilePic || '/avatar.png'} alt={event.creator.fullName} />
                </div>
              </div>
              <div>
                <span className="font-semibold text-xs leading-tight">{event.creator.fullName}</span>
                <div className="text-xs text-base-content/50">@{event.creator.username}</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ReportButton contentType="event" contentId={event._id} />
              <Link to={`/events/${event._id}`} className="btn btn-primary btn-xs">View</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
