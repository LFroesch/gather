import { useState, useEffect } from 'react';
import { Search, X, Calendar, User, FileText } from 'lucide-react';
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

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSearch = async () => {
    if (!query || query.length < 2) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}&type=${searchType}`);
      setResults(response.data.results);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (type, item) => {
    if (type === 'event') {
      navigate(`/event/${item._id}`);
    } else if (type === 'user') {
      navigate(`/profile/${item.username}`);
    } else if (type === 'post') {
      navigate(`/post/${item._id}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-base-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <Search className="size-5 text-base-content/60" />
            <input
              type="text"
              placeholder="Search events, users, posts..."
              className="flex-1 bg-transparent outline-none text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X className="size-5" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-3">
            <button
              className={`btn btn-sm ${searchType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSearchType('all')}
            >
              All ({summary.total})
            </button>
            <button
              className={`btn btn-sm ${searchType === 'events' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSearchType('events')}
            >
              <Calendar className="size-4" />
              Events ({summary.events})
            </button>
            <button
              className={`btn btn-sm ${searchType === 'users' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSearchType('users')}
            >
              <User className="size-4" />
              Users ({summary.users})
            </button>
            <button
              className={`btn btn-sm ${searchType === 'posts' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSearchType('posts')}
            >
              <FileText className="size-4" />
              Posts ({summary.posts})
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="text-center py-8 text-base-content/60">
              Type at least 2 characters to search
            </div>
          )}

          {!isLoading && query.length >= 2 && summary.total === 0 && (
            <div className="text-center py-8 text-base-content/60">
              No results found for "{query}"
            </div>
          )}

          {/* Events */}
          {(searchType === 'all' || searchType === 'events') && results.events.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-base-content/60">EVENTS</h3>
              <div className="space-y-2">
                {results.events.map((event) => (
                  <button
                    key={event._id}
                    onClick={() => handleResultClick('event', event)}
                    className="w-full text-left p-3 rounded-lg hover:bg-base-200 transition"
                  >
                    <div className="flex items-start gap-3">
                      <Calendar className="size-5 mt-1 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="text-sm text-base-content/60 truncate">
                          {new Date(event.date).toLocaleDateString()} • {event.location?.city}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {(searchType === 'all' || searchType === 'users') && results.users.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-base-content/60">USERS</h3>
              <div className="space-y-2">
                {results.users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleResultClick('user', user)}
                    className="w-full text-left p-3 rounded-lg hover:bg-base-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePic || '/avatar.png'}
                        alt={user.fullName}
                        className="size-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{user.fullName}</div>
                        <div className="text-sm text-base-content/60 truncate">@{user.username}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {(searchType === 'all' || searchType === 'posts') && results.posts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-base-content/60">POSTS</h3>
              <div className="space-y-2">
                {results.posts.map((post) => (
                  <button
                    key={post._id}
                    onClick={() => handleResultClick('post', post)}
                    className="w-full text-left p-3 rounded-lg hover:bg-base-200 transition"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="size-5 mt-1 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-base-content/60 mb-1">
                          {post.author?.fullName}
                        </div>
                        <div className="line-clamp-2">{post.content}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="p-3 border-t border-base-300 text-xs text-base-content/60 text-center">
          Press <kbd className="kbd kbd-xs">ESC</kbd> to close
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
