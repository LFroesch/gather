import { Heart, MessageCircle, MapPin, Calendar } from 'lucide-react';
import ReportButton from './ReportButton';
import { Link } from 'react-router-dom';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistance } from '../lib/utils';

const PostCard = ({ post }) => {
  const { toggleLike } = usePostStore();
  const { authUser } = useAuthStore();

  const isLiked = post.likes?.includes(authUser._id);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleLike(post._id);
    } catch (error) {
      // handled by store toast
    }
  };

  const timeAgo = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!post.author) return null;

  const shortLocation = `${post.location.city}, ${post.location.state}`;
  const mapsQuery = post.placeName
    ? `${post.placeName} ${shortLocation}`
    : shortLocation;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const locationLabel = post.placeName || shortLocation;

  const Actions = () => (
    <div className="flex items-center gap-1">
      <button
        className={`btn btn-sm btn-ghost gap-1 ${
          isLiked ? 'text-red-500' : 'text-base-content/60 hover:text-red-500'
        }`}
        onClick={handleLike}
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        <span className="text-xs font-medium">{post.likes?.length || 0}</span>
      </button>
      <Link
        to={`/posts/${post._id}`}
        className="btn btn-ghost btn-sm gap-1 text-base-content/60 hover:text-primary"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-medium">{post.commentCount || 0}</span>
      </Link>
      <div className="ml-auto">
        <ReportButton contentType="post" contentId={post._id} />
      </div>
    </div>
  );

  // ── Post WITH image ── image top, info below ──
  if (post.image) {
    return (
      <div className="card card-lift bg-base-100 shadow-md overflow-hidden">
        {/* Full-bleed image */}
        <Link to={`/posts/${post._id}`} className="block">
          <div className="h-64 sm:h-72 overflow-hidden">
            <img src={post.image} alt="Post" className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* Content + author */}
        <div className="px-4 py-3 flex flex-col gap-2">
          {post.content && (
            <Link to={`/posts/${post._id}`}>
              <p className="text-sm text-base-content/80 line-clamp-2">{post.content}</p>
            </Link>
          )}
          <div className="flex items-center justify-between">
            <Link
              to={`/profile/${post.author.username}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img src={post.author.profilePic || '/avatar.png'} alt={post.author.fullName} />
                </div>
              </div>
              <div>
                <span className="font-semibold text-xs leading-tight">{post.author.fullName}</span>
                <div className="text-xs text-base-content/50">@{post.author.username} · {timeAgo(post.createdAt)}</div>
              </div>
            </Link>
            <Actions />
          </div>
        </div>

        {/* Location footer banner */}
        <div className="bg-primary/10 px-4 py-2.5 flex flex-wrap items-center gap-2">
          {post.placeName ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <MapPin className="w-4 h-4" />
              {post.placeName}
              <span className="text-xs font-normal text-base-content/50">{shortLocation}</span>
            </a>
          ) : (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <MapPin className="w-4 h-4" />
              {shortLocation}
            </a>
          )}
          {post.distanceInMiles !== undefined && post.distanceInMiles > 0 && (
            <span className="text-xs text-base-content/50">{formatDistance(post.distanceInMiles)} away</span>
          )}
          {post.event && (
            <Link
              to={`/events/${post.event._id}`}
              className="btn btn-outline btn-primary btn-xs gap-1 ml-auto"
            >
              <Calendar className="w-3.5 h-3.5" />
              {post.event.title}
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isShort = post.content && post.content.length < 100;
  const hasPlaceOrEvent = post.placeName || post.event;

  // ── Short text post ── centered thought card ──
  if (isShort && !hasPlaceOrEvent) {
    return (
      <div className="card card-lift bg-base-100 shadow-md overflow-hidden">
        <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
          <Link to={`/posts/${post._id}`}>
            <p className="text-lg font-semibold text-base-content leading-relaxed">{post.content}</p>
          </Link>
          <Link
            to={`/profile/${post.author.username}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="avatar">
              <div className="w-8 h-8 rounded-full">
                <img src={post.author.profilePic || '/avatar.png'} alt={post.author.fullName} />
              </div>
            </div>
            <div className="text-left">
              <span className="font-semibold text-xs leading-tight">{post.author.fullName}</span>
              <div className="text-xs text-base-content/50">@{post.author.username} · {timeAgo(post.createdAt)}</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <MapPin className="w-3.5 h-3.5" />
              {locationLabel}
            </a>
            {post.distanceInMiles !== undefined && post.distanceInMiles > 0 && (
              <span className="text-xs text-base-content/50">{formatDistance(post.distanceInMiles)} away</span>
            )}
          </div>
          <Actions />
        </div>
      </div>
    );
  }

  // ── Place/event tagged post ── location check-in style ──
  if (hasPlaceOrEvent) {
    return (
      <div className="card card-lift bg-base-100 shadow-md overflow-hidden">
        <div className="px-4 py-3 flex flex-col gap-2">
          {/* Author */}
          <Link
            to={`/profile/${post.author.username}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="avatar">
              <div className="w-8 h-8 rounded-full">
                <img src={post.author.profilePic || '/avatar.png'} alt={post.author.fullName} />
              </div>
            </div>
            <div>
              <span className="font-semibold text-sm leading-tight">{post.author.fullName}</span>
              <div className="text-xs text-base-content/50">@{post.author.username} · {timeAgo(post.createdAt)}</div>
            </div>
          </Link>

          <Link to={`/posts/${post._id}`}>
            <p className="text-sm text-base-content/80">{post.content}</p>
          </Link>

          <Actions />
        </div>

        {/* Location footer banner */}
        <div className="bg-primary/10 px-4 py-2.5 flex flex-wrap items-center gap-2">
          {post.placeName ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <MapPin className="w-4 h-4" />
              {post.placeName}
              <span className="text-xs font-normal text-base-content/50">{shortLocation}</span>
            </a>
          ) : (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <MapPin className="w-4 h-4" />
              {shortLocation}
            </a>
          )}
          {post.distanceInMiles !== undefined && post.distanceInMiles > 0 && (
            <span className="text-xs text-base-content/50">{formatDistance(post.distanceInMiles)} away</span>
          )}
          {post.event && (
            <Link
              to={`/events/${post.event._id}`}
              className="btn btn-outline btn-primary btn-xs gap-1 ml-auto"
            >
              <Calendar className="w-3.5 h-3.5" />
              {post.event.title}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Long text-only post ── inline avatar layout ──
  return (
    <div className="card card-lift bg-base-100 shadow-md overflow-hidden">
      <div className="px-4 py-4 flex gap-3">
        {/* Avatar column */}
        <Link to={`/profile/${post.author.username}`} className="shrink-0 mt-0.5">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full">
              <img src={post.author.profilePic || '/avatar.png'} alt={post.author.fullName} />
            </div>
          </div>
        </Link>

        {/* Content column */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <Link
            to={`/profile/${post.author.username}`}
            className="hover:opacity-80 transition-opacity"
          >
            <span className="font-semibold text-sm">{post.author.fullName}</span>
            <span className="text-xs text-base-content/50 ml-1.5">@{post.author.username} · {timeAgo(post.createdAt)}</span>
          </Link>

          <Link to={`/posts/${post._id}`}>
            <p className="text-sm text-base-content/80 line-clamp-4">{post.content}</p>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <MapPin className="w-3.5 h-3.5" />
              {locationLabel}
            </a>
            {post.distanceInMiles !== undefined && post.distanceInMiles > 0 && (
              <span className="text-xs text-base-content/50">{formatDistance(post.distanceInMiles)} away</span>
            )}
          </div>

          <Actions />
        </div>
      </div>
    </div>
  );
};

export default PostCard;
