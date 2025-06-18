import { Heart, MessageCircle, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistance } from '../lib/utils';

const PostCard = ({ post }) => {
  const { toggleLike } = usePostStore();
  const { authUser } = useAuthStore();

  const isLiked = post.likes?.includes(authUser._id);

  const handleLike = async () => {
    try {
      await toggleLike(post._id);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/profile/${post.author.username}`}>
            <div className="avatar">
              <div className="w-10 h-10 rounded-full">
                <img 
                  src={post.author.profilePic || '/avatar.png'} 
                  alt={post.author.fullName}
                />
              </div>
            </div>
          </Link>
          <div className="flex-1">
            <Link 
              to={`/profile/${post.author.username}`}
              className="font-medium hover:text-primary"
            >
              {post.author.fullName}
            </Link>
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <span>@{post.author.username}</span>
              <span>•</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-base-content mb-3">{post.content}</p>
          
          {post.image && (
            <img 
              src={post.image} 
              alt="Post image"
              className="rounded-lg max-w-full h-auto"
            />
          )}
        </div>

        {/* Event Reference */}
        {post.event && (
          <Link 
            to={`/events/${post.event._id}`}
            className="flex items-center gap-2 p-3 bg-base-200 rounded-lg mb-4 hover:bg-base-300 transition-colors"
          >
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Related to: {post.event.title}</span>
          </Link>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-base-content/60 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{post.location.city}, {post.location.state}</span>
          {post.distanceInMiles !== undefined && post.distanceInMiles > 0 && (
            <span className="text-primary">
              ({formatDistance(post.distanceInMiles)})
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button 
            className={`flex items-center gap-2 btn btn-ghost btn-sm ${
              isLiked ? 'text-red-500' : 'text-base-content/60'
            }`}
            onClick={handleLike}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes?.length || 0}</span>
          </button>
          
          <button className="flex items-center gap-2 btn btn-ghost btn-sm text-base-content/60">
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;