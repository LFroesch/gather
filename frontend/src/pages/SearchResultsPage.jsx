import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Users, MapPin, UserPlus, UserCheck, Clock, Search } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useFriendStore } from '../store/useFriendStore';
import EventCard from '../components/EventCard';
import PostCard from '../components/PostCard';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);
  const [activeTab, setActiveTab] = useState('events');
  const [scope, setScope] = useState('nearby');
  const [results, setResults] = useState({ events: [], posts: [], users: [] });
  const [loading, setLoading] = useState({ events: false, posts: false, users: false });
  const abortRef = useRef(null);

  const search = useCallback(async () => {
    if (query.length < 2) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading({ events: true, posts: true, users: true });

    const opts = { signal: controller.signal };
    const params = `q=${encodeURIComponent(query)}&scope=${scope}`;

    const [eventsRes, postsRes, usersRes] = await Promise.allSettled([
      axiosInstance.get(`/events/search?${params}`, opts),
      axiosInstance.get(`/posts/search?${params}`, opts),
      axiosInstance.get(`/auth/search?${params}`, opts),
    ]);

    if (controller.signal.aborted) return;

    setResults({
      events: eventsRes.status === 'fulfilled' ? eventsRes.value.data : [],
      posts: postsRes.status === 'fulfilled' ? postsRes.value.data : [],
      users: usersRes.status === 'fulfilled' ? usersRes.value.data : [],
    });
    setLoading({ events: false, posts: false, users: false });
  }, [query, scope]);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    search();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [search]);

  const handleLocalSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim().length >= 2) {
      setSearchParams({ q: localQuery.trim() });
    }
  };

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar, count: results.events.length },
    { id: 'posts', label: 'Posts', icon: FileText, count: results.posts.length },
    { id: 'users', label: 'Users', icon: Users, count: results.users.length },
  ];

  const isLoading = loading[activeTab];

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-4xl animate-fade-up">
        {/* Search input (always visible, especially useful on mobile) */}
        <form onSubmit={handleLocalSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
            <input
              type="text"
              placeholder="Search events, posts, people..."
              className="input input-bordered w-full pl-11"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
          </div>
        </form>

        {query && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Results for "{query}"</h1>
          </div>
        )}

        {/* Scope Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-base-content/60">Search in:</span>
          <div className="tabs tabs-boxed bg-base-100 shadow border-2 border-base-300 font-bold">
            <button
              className={`tab tab-sm gap-1 ${scope === 'nearby' ? 'tab-active' : ''}`}
              onClick={() => setScope('nearby')}
            >
              <MapPin className="w-3 h-3" />
              Nearby
            </button>
            <button
              className={`tab tab-sm gap-1 ${scope === 'following' ? 'tab-active' : ''}`}
              onClick={() => setScope('following')}
            >
              <Users className="w-3 h-3" />
              Following
            </button>
          </div>
        </div>

        {/* Result Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-lg border-2 border-base-300 font-bold mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab tab-lg flex-1 gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className="badge badge-sm">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <>
              {activeTab === 'events' && (
                results.events.length > 0
                  ? results.events.map((event) => <EventCard key={event._id} event={event} />)
                  : <EmptyState type="events" query={query} />
              )}

              {activeTab === 'posts' && (
                results.posts.length > 0
                  ? results.posts.map((post) => <PostCard key={post._id} post={post} />)
                  : <EmptyState type="posts" query={query} />
              )}

              {activeTab === 'users' && (
                results.users.length > 0
                  ? results.users.map((user) => <UserCard key={user._id} user={user} />)
                  : <EmptyState type="users" query={query} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const UserCard = ({ user }) => {
  const { authUser } = useAuthStore();
  const { friendStatus, checkFriendStatus, sendFriendRequest, isProcessing } = useFriendStore();
  const status = friendStatus[user._id];
  const isOwnProfile = authUser?._id === user._id;

  useEffect(() => {
    if (!isOwnProfile) checkFriendStatus(user._id);
  }, [user._id, isOwnProfile, checkFriendStatus]);

  const handleAddFriend = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendFriendRequest(user._id);
  };

  return (
    <Link
      to={`/profile/${user.username}`}
      className="flex items-center gap-4 p-4 bg-base-100 rounded-lg hover:bg-base-200 transition-colors"
    >
      <div className="avatar">
        <div className="w-12 h-12 rounded-full">
          <img src={user.profilePic || '/avatar.png'} alt={user.fullName} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.fullName}</p>
        <p className="text-sm text-base-content/60">@{user.username}</p>
        {user.currentCity?.city && (
          <p className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {user.currentCity.city}, {user.currentCity.state}
          </p>
        )}
      </div>
      {!isOwnProfile && (
        <>
          {status === 'friends' ? (
            <span className="btn btn-ghost btn-sm gap-1 no-animation pointer-events-none">
              <UserCheck className="w-4 h-4 text-success" />
              Friends
            </span>
          ) : status === 'pending_sent' ? (
            <span className="btn btn-ghost btn-sm gap-1 no-animation pointer-events-none">
              <Clock className="w-4 h-4" />
              Pending
            </span>
          ) : status === 'pending_received' ? (
            <span className="btn btn-ghost btn-sm gap-1 no-animation pointer-events-none">
              <Clock className="w-4 h-4 text-warning" />
              Respond
            </span>
          ) : (
            <button
              className="btn btn-primary btn-sm gap-1"
              onClick={handleAddFriend}
              disabled={isProcessing}
            >
              <UserPlus className="w-4 h-4" />
              Add
            </button>
          )}
        </>
      )}
    </Link>
  );
};

const EmptyState = ({ type, query }) => (
  <div className="text-center py-16">
    <p className="text-base-content/60">
      No {type} found for "{query}"
    </p>
  </div>
);

export default SearchResultsPage;
