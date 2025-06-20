import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  ArrowLeft,
  Share,
  Trash2
} from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { formatDistance } from '../lib/utils';
import toast from 'react-hot-toast';

const PostPage = () => {
  const { postId } = useParams();
  const { authUser } = useAuthStore();
  const { toggleLike, deletePost } = usePostStore();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/posts/${postId}`);
      setPost(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const result = await toggleLike(post._id);
      // Update local post state
      setPost(prev => ({
        ...prev,
        likes: result.likes
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleDelete = async () => {
    if (!post || post.author._id !== authUser._id) return;
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(post._id);
        toast.success('Post deleted successfully');
        // Navigate back
        window.history.back();
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.fullName}`,
          text: post.content,
          url: postUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          fallbackShare(postUrl);
        }
      }
    } else {
      fallbackShare(postUrl);
    }
  };

  const fallbackShare = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 pt-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-base-100 rounded-xl shadow-lg p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-base-300 rounded w-1/4"></div>
              <div className="h-8 bg-base-300 rounded w-3/4"></div>
              <div className="h-32 bg-base-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-base-200 pt-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Post not found</h2>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLiked = post.likes?.includes(authUser._id);
  const isAuthor = post.author._id === authUser._id;

  return (
    <div className="min-h-screen bg-base-200 pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="btn btn-ghost btn-sm mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Post Content */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            <Link to={`/profile/${post.author.username}`}>
              <div className="avatar">
                <div className="w-12 h-12 rounded-full">
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
                className="font-medium text-lg hover:text-primary"
              >
                {post.author.fullName}
              </Link>
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            {/* Action Menu */}
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-sm">
                •••
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <button onClick={handleShare} className="gap-2">
                    <Share className="w-4 h-4" />
                    Share Post
                  </button>
                </li>
                {isAuthor && (
                  <li>
                    <button 
                      onClick={handleDelete} 
                      className="gap-2 text-error hover:bg-error/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Post
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-6">
            <p className="text-lg leading-relaxed mb-4">{post.content}</p>
            
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
              className="flex items-center gap-2 p-4 bg-base-200 rounded-lg mb-6 hover:bg-base-300 transition-colors"
            >
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">Related to: {post.event.title}</span>
            </Link>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-base-content/60 mb-6">
            <MapPin className="w-5 h-5" />
            <span>{post.location.city}, {post.location.state}</span>
            {post.distanceInMiles !== undefined && post.distanceInMiles > 0 && (
              <span className="text-primary">
                ({formatDistance(post.distanceInMiles)})
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-base-300">
            <button 
              className={`flex items-center gap-2 btn btn-ghost transition-colors ${
                isLiked ? 'text-red-500 hover:text-red-600' : 'text-base-content/60 hover:text-red-500'
              }`}
              onClick={handleLike}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes?.length || 0}</span>
            </button>
            
            <button className="flex items-center gap-2 btn btn-ghost text-base-content/60 hover:text-primary">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Comment</span>
            </button>

            <button 
              className="flex items-center gap-2 btn btn-ghost text-base-content/60 hover:text-primary ml-auto"
              onClick={handleShare}
            >
              <Share className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section (Placeholder for future implementation) */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-bold mb-4">Comments</h3>
          <div className="text-center py-8 text-base-content/60">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Comments feature coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;