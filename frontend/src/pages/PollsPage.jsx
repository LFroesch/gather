import { useEffect, useState, useMemo } from 'react';
import { usePollStore } from '../store/usePollStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLocationStore } from '../store/useLocationStore';
import LocationPicker from '../components/LocationPicker';
import { Plus, BarChart3, Clock, Trash2, CheckCircle2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'recommendations', label: 'Recommendations' },
  { value: 'opinion', label: 'Opinion' },
  { value: 'planning', label: 'Planning' },
  { value: 'fun', label: 'Fun' },
  { value: 'general', label: 'General' },
];

const CATEGORY_COLORS = {
  recommendations: 'badge-info',
  opinion: 'badge-warning',
  planning: 'badge-secondary',
  fun: 'badge-accent',
  general: 'badge-ghost',
};

const mapsUrl = (placeName, city, state) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName} ${city}, ${state}`)}`;

const PollCard = ({ poll, onVote, onDelete, currentUserId }) => {
  const isExpired = new Date(poll.expiresAt) <= new Date();
  const isPending = poll.status === 'pending';
  const isRejected = poll.status === 'rejected';
  const hasVoted = poll.userVotedOption !== null;
  const showResults = hasVoted || isExpired;
  const isOwner = poll.creator?._id === currentUserId;

  const timeLeft = () => {
    const diff = new Date(poll.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  return (
    <div className={`card card-lift bg-base-100 shadow-md ${isExpired || isRejected ? 'opacity-75' : ''}`}>
      <div className="card-body p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow">
            <h3 className="font-bold text-lg leading-tight">{poll.question}</h3>
            <div className="mt-1 text-sm text-base-content/60">
              {poll.creator?.username ? (
                <Link to={`/profile/${poll.creator.username}`} className="font-semibold hover:text-primary transition-colors">
                  by {poll.creator.username}
                </Link>
              ) : (
                <span className="font-semibold">by Unknown</span>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {poll.category && (
                  <span className={`badge badge-md ${CATEGORY_COLORS[poll.category] || 'badge-ghost'}`}>
                    {poll.category}
                  </span>
                )}
                {poll.isDemo && <span className="badge badge-md badge-ghost text-base-content/40">Sample</span>}
                {isPending && <span className="badge badge-warning badge-md">Pending Approval</span>}
                {isRejected && <span className="badge badge-error badge-md">Rejected</span>}
                {!isPending && !isRejected && (
                  <span className={`badge badge-md flex items-center gap-1 ${isExpired ? 'badge-error' : 'badge-success'}`}>
                    <Clock className="w-3 h-3" />
                    {timeLeft()}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => onDelete(poll._id)}
              className="btn btn-ghost btn-xs btn-circle text-error"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2 mt-3">
          {poll.options.map((opt, idx) => {
            const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
            const isSelected = poll.userVotedOption === idx;

            return showResults ? (
              <div key={opt._id} className="relative">
                <div
                  className={`h-10 rounded-lg overflow-hidden border ${
                    isSelected ? 'border-primary' : 'border-base-300'
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-500 ${
                      isSelected ? 'bg-primary/20' : 'bg-base-200'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    {opt.text}
                  </span>
                  <span className="font-semibold">{pct}%</span>
                </div>
              </div>
            ) : (
              <button
                key={opt._id}
                onClick={() => onVote(poll._id, idx)}
                disabled={isExpired}
                className="btn btn-outline btn-block justify-start font-normal h-10 min-h-0"
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-base-content/50 mt-2">
          <span>{poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}</span>
          {poll.location?.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {poll.placeName ? (
                <a
                  href={mapsUrl(poll.placeName, poll.location.city, poll.location.state)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {poll.placeName}
                </a>
              ) : (
                <span>{poll.location.city}, {poll.location.state}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const CreatePollModal = ({ isOpen, onClose, onSubmit }) => {
  const { currentLocation } = useLocationStore();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresIn, setExpiresIn] = useState('1d');
  const [category, setCategory] = useState('general');
  const [location, setLocation] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) return;

    if (!location) {
      toast.error('Please select a location', { id: 'poll-location' });
      return;
    }

    const durations = { '1h': 3600000, '6h': 21600000, '1d': 86400000, '3d': 259200000, '7d': 604800000 };
    const expiresAt = new Date(Date.now() + durations[expiresIn]);

    try {
      await onSubmit({
        question,
        options: validOptions,
        expiresAt,
        category,
        location: {
          city: location.city,
          state: location.state,
          country: location.country,
          coordinates: location.coordinates
        },
        placeName: location.placeName || undefined
      });
      setQuestion('');
      setOptions(['', '']);
      setExpiresIn('1d');
      setCategory('general');
      setLocation(null);
      onClose();
    } catch {
      // error handled by store
    }
  };

  const addOption = () => {
    if (options.length < 4) setOptions([...options, '']);
  };

  const removeOption = (idx) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-lg">
        <h3 className="font-bold text-xl mb-4">Create a Poll</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label"><span className="label-text">Question *</span></label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="What do you want to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="form-control mb-4">
            <label className="label"><span className="label-text">Options *</span></label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-grow"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    maxLength={100}
                    required
                  />
                  {options.length > 2 && (
                    <button type="button" className="btn btn-ghost btn-square" onClick={() => removeOption(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 4 && (
              <button type="button" className="btn btn-ghost btn-sm mt-2 gap-1" onClick={addOption}>
                <Plus className="w-4 h-4" /> Add Option
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Category</span></label>
              <select
                className="select select-bordered"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.filter(c => c.value).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Duration</span></label>
              <select
                className="select select-bordered"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
              >
                <option value="1h">1 hour</option>
                <option value="6h">6 hours</option>
                <option value="1d">1 day</option>
                <option value="3d">3 days</option>
                <option value="7d">7 days</option>
              </select>
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label"><span className="label-text">Location *</span></label>
            <LocationPicker
              onLocationSelect={setLocation}
              initialLocation={currentLocation}
              showPlaceName={true}
              placeholderPlace="Tag a place (optional)"
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Poll</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

const PollsPage = () => {
  const { polls, isLoading, filter, getPolls, createPoll, votePoll, deletePoll } = usePollStore();
  const { authUser } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    getPolls();
  }, [getPolls]);

  const filters = [
    { id: 'active', label: 'Active' },
    { id: 'expired', label: 'Past' },
    { id: 'mine', label: 'My Polls' },
  ];

  const sortedPolls = useMemo(() => {
    let list = [...polls];
    if (categoryFilter) {
      list = list.filter(p => p.category === categoryFilter);
    }
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'most-voted') list.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
    else if (sortBy === 'ending-soon') list.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    return list;
  }, [polls, sortBy, categoryFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-5xl animate-fade-up">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">Polls</h1>
          <p className="text-base-content/70">Vote on community questions</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          {/* Filter tabs */}
          <div className="tabs tabs-boxed bg-base-100 shadow border-2 border-base-300 font-bold">
            {filters.map(f => (
              <button
                key={f.id}
                className={`tab text-xs sm:text-sm ${filter === f.id ? 'tab-active' : ''}`}
                onClick={() => getPolls(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="select select-bordered select-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              className="select select-bordered select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="most-voted">Most Voted</option>
              <option value="ending-soon">Ending Soon</option>
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Poll</span>
            </button>
          </div>
        </div>

        {/* Polls List */}
        {sortedPolls.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {sortedPolls.map(poll => (
              <div key={poll._id} className="break-inside-avoid">
                <PollCard
                  poll={poll}
                  onVote={votePoll}
                  onDelete={deletePoll}
                  currentUserId={authUser?._id}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {filter === 'mine' ? 'No polls yet' : filter === 'expired' ? 'No past polls' : 'No active polls'}
            </h3>
            <p className="text-base-content/70 mb-6">
              {filter === 'mine' ? 'Create your first poll!' : 'Be the first to create one'}
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary gap-2">
              <Plus className="w-4 h-4" /> Create Poll
            </button>
          </div>
        )}

        <CreatePollModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={createPoll}
        />
      </div>
    </div>
  );
};

export default PollsPage;
