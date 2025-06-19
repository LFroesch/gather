import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, MessageSquare, UserPlus, UserMinus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFollowStore } from '../store/useFollowStore';
import { usePostStore } from '../store/usePostStore';
import { useChatStore } from '../store/useChatStore';
import { axiosInstance } from '../lib/axios';
import PostCard from '../components/PostCard';
import EventCard from '../components/EventCard';
import toast from 'react-hot-toast';

const OtherUserProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { followUser, unfollowUser, checkFollowStatus, followingStatus, isFollowing } = useFollowStore();
  const { getUserPosts, userPosts, isLoading: postsLoading } = usePostStore();
  const { setSelectedUser } = useChatStore();
  const [user, setUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  const isFollowingUser = followingStatus[user?._id] || false;

  useEffect(() => {
    if (username) {
      fetchUser();
    }
  }, [username]);

  useEffect(() => {
    if (user) {
      checkFollowStatus(user._id);
      if (activeTab === 'posts') {
        getUserPosts(user._id);
      } else if (activeTab === 'events') {
        fetchUserEvents();
      }
    }
  }, [user, activeTab, checkFollowStatus, getUserPosts]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/auth/user/${username}`);
      setUser(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch user');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserEvents = async () => {
    try {
      // Since we don't have a specific endpoint for user's events they're attending,
      // we'll use the my-events endpoint when viewing our own profile
      // For now, we'll show a placeholder
      setUserEvents([]);
    } catch (error) {
      console.error('Failed to fetch user events:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowingUser) {
        await unfollowUser(user._id);
        // Update the user's follower count locally
        setUser(prev => ({
          ...prev,
          followerCount: Math.max(0, (prev.followerCount || 0) - 1)
        }));
      } else {
        await followUser(user._id);
        // Update the user's follower count locally
        setUser(prev => ({
          ...prev,
          followerCount: (prev.followerCount || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  const handleMessage = () => {
    // Set the selected user in chat store and navigate to messages
    setSelectedUser(user);
    navigate('/messages');
  };

  if (isLoading) {
    return (
      <div className="bg-base-200 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-base-100 rounded-xl shadow-lg p-6">
            <div className="animate-pulse">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-base-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-base-300 rounded w-48"></div>
                  <div className="h-4 bg-base-300 rounded w-32"></div>
                  <div className="h-4 bg-base-300 rounded w-40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-base-200 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">User not found</h2>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-200 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full">
                  <img 
                    src={user.profilePic || '/avatar.png'} 
                    alt={user.fullName}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.fullName}</h1>
                <p className="text-base-content/60 mb-2">@{user.username}</p>
                {user.bio && (
                  <p className="text-base-content/80 mb-3 max-w-md">{user.bio}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-base-content/60">
                  <span>{user.followerCount || 0} followers</span>
                  <span>{user.followingCount || 0} following</span>
                  <span>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {authUser._id !== user._id && (
              <div className="flex gap-2">
                <button
                  className={`btn ${isFollowingUser ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleFollow}
                  disabled={isFollowing}
                >
                  {isFollowing ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : isFollowingUser ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={handleMessage}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-lg mb-6">
          <button
            className={`tab tab-lg ${activeTab === 'posts' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`tab tab-lg ${activeTab === 'events' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'posts' && (
            <>
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {userPosts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                  {userPosts.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-base-content/60">
                        {user.fullName} hasn't posted anything yet
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'events' && (
            <>
              {userEvents.map((event) => (
                <EventCard key={event._id} event={event} showRSVPStatus />
              ))}
              {userEvents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-base-content/60">
                    {user.fullName} isn't attending any public events
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherUserProfilePage;