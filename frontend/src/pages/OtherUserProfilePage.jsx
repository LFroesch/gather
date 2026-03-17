import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, MessageSquare, UserPlus, UserMinus, Clock, UserCheck, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFollowStore } from '../store/useFollowStore';
import { useFriendStore } from '../store/useFriendStore';
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
  const {
    friendStatus, canMessage, isProcessing,
    checkFriendStatus, sendFriendRequest, acceptFriendRequest,
    rejectFriendRequest, cancelFriendRequest, removeFriend
  } = useFriendStore();
  const { getUserPosts, userPosts, isLoading: postsLoading } = usePostStore();
  const { setSelectedUser } = useChatStore();
  const [user, setUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);

  const isFollowingUser = followingStatus[user?._id] || false;
  const currentFriendStatus = friendStatus[user?._id] || 'none';
  const canMessageUser = canMessage[user?._id] || false;

  useEffect(() => {
    if (username) fetchUser();
  }, [username]);

  useEffect(() => {
    if (user) {
      checkFollowStatus(user._id);
      checkFriendStatus(user._id);
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
      setEventsLoading(true);
      const res = await axiosInstance.get(`/events/user/${user._id}/rsvped`);
      setUserEvents(res.data);
    } catch (error) {
      console.error('Failed to fetch user events:', error);
      toast.error('Failed to fetch events');
      setUserEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowingUser) {
        await unfollowUser(user._id);
        setUser(prev => ({ ...prev, followerCount: Math.max(0, (prev.followerCount || 0) - 1) }));
      } else {
        await followUser(user._id);
        setUser(prev => ({ ...prev, followerCount: (prev.followerCount || 0) + 1 }));
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  const handleMessage = () => {
    setSelectedUser(user);
    navigate('/messages');
  };

  const handleFriendAction = async () => {
    if (!user) return;
    switch (currentFriendStatus) {
      case 'none':
        await sendFriendRequest(user._id);
        setUser(prev => ({ ...prev, friendCount: (prev.friendCount || 0) }));
        break;
      case 'pending_sent':
        await cancelFriendRequest(user._id);
        break;
      case 'friends':
        setShowUnfriendConfirm(true);
        break;
    }
  };

  const handleUnfriend = async () => {
    await removeFriend(user._id);
    setUser(prev => ({ ...prev, friendCount: Math.max(0, (prev.friendCount || 0) - 1) }));
    setShowUnfriendConfirm(false);
  };

  const handleAcceptRequest = async () => {
    await acceptFriendRequest(user._id);
    setUser(prev => ({ ...prev, friendCount: (prev.friendCount || 0) + 1 }));
  };

  const handleRejectRequest = async () => {
    await rejectFriendRequest(user._id);
  };

  if (isLoading) {
    return (
      <div className="bg-base-200 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-base-100 rounded-xl shadow-lg border-2 border-base-300 p-6">
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
            <Link to="/events" className="btn btn-primary">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-200 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-4xl animate-fade-up">
        {/* Profile Header */}
        <div className="bg-base-100 rounded-xl shadow-lg border-2 border-base-300 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full">
                  <img src={user.profilePic || '/avatar.png'} alt={user.fullName} />
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
                  <span>{user.friendCount || 0} friends</span>
                  <span>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {authUser._id !== user._id && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {/* Follow button */}
                  <button
                    className={`btn btn-sm ${isFollowingUser ? 'btn-outline' : 'btn-primary'}`}
                    onClick={handleFollow}
                    disabled={isFollowing}
                  >
                    {isFollowing ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : isFollowingUser ? (
                      <><UserMinus className="w-4 h-4" /> Unfollow</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Follow</>
                    )}
                  </button>

                  {/* Message button — only if allowed */}
                  {canMessageUser && (
                    <button className="btn btn-outline btn-sm" onClick={handleMessage}>
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  )}
                </div>

                {/* Friend buttons */}
                <div className="flex gap-2">
                  {currentFriendStatus === 'none' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleFriendAction}
                      disabled={isProcessing}
                    >
                      <UserPlus className="w-4 h-4" /> Add Friend
                    </button>
                  )}
                  {currentFriendStatus === 'pending_sent' && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleFriendAction}
                      disabled={isProcessing}
                    >
                      <Clock className="w-4 h-4" /> Cancel Request
                    </button>
                  )}
                  {currentFriendStatus === 'pending_received' && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={handleAcceptRequest}
                        disabled={isProcessing}
                      >
                        <UserCheck className="w-4 h-4" /> Accept
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={handleRejectRequest}
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}
                  {currentFriendStatus === 'friends' && (
                    <button
                      className="btn btn-outline btn-error btn-sm"
                      onClick={handleFriendAction}
                      disabled={isProcessing}
                    >
                      <UserMinus className="w-4 h-4" /> Unfriend
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Unfriend Confirmation Dialog */}
        {showUnfriendConfirm && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Remove Friend</h3>
              <p className="py-4">Are you sure you want to remove {user.fullName} as a friend?</p>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowUnfriendConfirm(false)}>Cancel</button>
                <button className="btn btn-error" onClick={handleUnfriend} disabled={isProcessing}>Remove</button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowUnfriendConfirm(false)}></div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-lg border-2 border-base-300 font-bold mb-6">
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
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherUserProfilePage;
