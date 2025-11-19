import { useState, useEffect } from 'react';
import { Search, X, Calendar, User, FileText, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState({ events: [], users: [], posts: [] });
  const [summary, setSummary] = useState({ total: 0, events: 0, users: 0, posts: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ events: [], users: [], posts: [] });
      setSummary({ total: 0, events: 0, users: 0, posts: 0 });
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(`/api/search?q=${encodeURIComponent(query)}&type=${searchType}`);
        if (data.success) {
          setResults(data.results);
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error(error.response?.data?.message || 'Search failed');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searchType]);

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
    onClose();
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    onClose();
  };

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-base-100 rounded-lg shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-base-content/60" />
            <input
              type="text"
              placeholder="Search events, users, posts..."
              className="flex-1 bg-transparent outline-none text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type filters */}
          <div className="flex gap-2 mt-3">
            {['all', 'events', 'users', 'posts'].map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`btn btn-sm ${searchType === type ? 'btn-primary' : 'btn-ghost'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {summary[type] > 0 && ` (${summary[type]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}

          {!isLoading && query.length >= 2 && summary.total === 0 && (
            <div className="text-center py-8 text-base-content/60">
              No results found for "{query}"
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="text-center py-8 text-base-content/60">
              Type at least 2 characters to search
            </div>
          )}

          {!isLoading && (
            <>
              {/* Events */}
              {results.events.length > 0 && (searchType === 'all' || searchType === 'events') && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-base-content/60 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Events ({results.events.length})
                  </h3>
                  <div className="space-y-2">
                    {results.events.map(event => (
                      <div
                        key={event._id}
                        onClick={() => handleEventClick(event._id)}
                        className="p-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {event.image && (
                            <img src={event.image} alt="" className="w-12 h-12 rounded object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{event.title}</h4>
                            <p className="text-sm text-base-content/60 line-clamp-1">{event.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-base-content/60">
                              <span>{formatDate(event.date)}</span>
                              {event.location?.name && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location.name}
                                </span>
                              )}
                              {event.distance && (
                                <span>{event.distance.toFixed(1)} mi away</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (searchType === 'all' || searchType === 'users') && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-base-content/60 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Users ({results.users.length})
                  </h3>
                  <div className="space-y-2">
                    {results.users.map(user => (
                      <div
                        key={user._id}
                        onClick={() => handleUserClick(user.username)}
                        className="p-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || '/avatar.png'}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{user.fullName}</h4>
                            <p className="text-sm text-base-content/60 truncate">@{user.username}</p>
                            {user.bio && (
                              <p className="text-sm text-base-content/60 line-clamp-1 mt-1">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {results.posts.length > 0 && (searchType === 'all' || searchType === 'posts') && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-base-content/60 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Posts ({results.posts.length})
                  </h3>
                  <div className="space-y-2">
                    {results.posts.map(post => (
                      <div
                        key={post._id}
                        onClick={() => handlePostClick(post._id)}
                        className="p-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={post.author?.profilePic || '/avatar.png'}
                            alt={post.author?.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{post.author?.fullName}</h4>
                              <span className="text-sm text-base-content/60">@{post.author?.username}</span>
                            </div>
                            <p className="text-sm line-clamp-2 mt-1">{post.text}</p>
                            {post.event && (
                              <p className="text-xs text-primary mt-1">Posted in: {post.event.title}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-base-300 text-xs text-base-content/60 text-center">
          Press ESC to close
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
