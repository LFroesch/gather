import { useEffect, useState } from 'react';
import { useVotingStore } from '../store/useVotingStore';
import { Play, Crown, Medal, Award, Plus, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import VotingStats from '../components/VotingStats';

const SongCard = ({ song, onVote, userHasVotedToday, votedSongId, isSubmittingVote, rank }) => {
  const isVotedFor = votedSongId === song._id;
  const canVote = !userHasVotedToday && !isSubmittingVote;

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center font-bold text-lg">#{rank}</span>;
    }
  };

  const getRankBorder = (rank) => {
    switch (rank) {
      case 1: return 'border-l-4 border-l-yellow-500';
      case 2: return 'border-l-4 border-l-gray-400';
      case 3: return 'border-l-4 border-l-amber-600';
      default: return '';
    }
  };

  return (
    <div className={`card bg-base-200 shadow-md ${getRankBorder(rank)} ${isVotedFor ? 'ring-2 ring-primary' : ''}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-4">
          {/* Rank */}
          <div className="flex-shrink-0">{getRankIcon(rank)}</div>

          {/* Song Info */}
          <div className="flex-grow min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate">{song.title}</h3>
            <p className="text-base-content/70 truncate">{song.artist}</p>
            <span className="text-xs text-base-content/50 mt-1">
              by {song.submitter?.[0]?.username || 'Unknown'}
            </span>
          </div>

          {/* Vote Section */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{song.dailyVoteCount}</div>
              <div className="text-xs text-base-content/60">votes</div>
            </div>
            <button
              onClick={() => onVote(song._id)}
              disabled={!canVote}
              className={`btn btn-sm ${
                isVotedFor
                  ? 'btn-primary'
                  : canVote
                    ? 'btn-outline btn-primary'
                    : 'btn-disabled'
              }`}
            >
              {isVotedFor ? 'Voted' : 'Vote'}
            </button>
            {song.previewUrl && (
              <button className="btn btn-sm btn-ghost btn-circle">
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SubmitSongModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    previewUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({ title: '', artist: '', album: '', previewUrl: '' });
      onClose();
    } catch (error) {
      // error handled by store toast
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-2xl">
        <h3 className="font-bold text-xl mb-4">Submit a Song</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Title *</span></label>
              <input type="text" className="input input-bordered" value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Artist *</span></label>
              <input type="text" className="input input-bordered" value={formData.artist}
                onChange={(e) => setFormData(prev => ({...prev, artist: e.target.value}))} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Album</span></label>
              <input type="text" className="input input-bordered" value={formData.album}
                onChange={(e) => setFormData(prev => ({...prev, album: e.target.value}))} />
            </div>
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Song</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

const VotingPage = () => {
  const {
    songs,
    userHasVotedToday,
    votedSongId,
    isLoading,
    isSubmittingVote,
    getTodaysSongs,
    submitSong,
    voteSong,
    generateDeviceFingerprint
  } = useVotingStore();

  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    getTodaysSongs();
  }, [getTodaysSongs]);

  const handleVote = async (songId) => {
    try {
      const fingerprint = generateDeviceFingerprint();
      await voteSong(songId, fingerprint);
    } catch (error) {
      // error handled by store toast
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-4xl animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Song of the Day</h1>
          <p className="text-base-content/70 text-lg">One vote. One song. One winner.</p>
        </div>

        {/* Status + Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          {userHasVotedToday ? (
            <div className="badge badge-lg badge-primary gap-2 p-4">Vote cast — return tomorrow</div>
          ) : (
            <div className="badge badge-lg badge-warning gap-2 p-4">1 vote remaining today</div>
          )}
          <Link to="/charts" className="btn btn-outline btn-sm">View Charts</Link>
          <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" /> Submit Song
          </button>
        </div>

        {/* Voting Stats */}
        <VotingStats />

        {/* Current Leader */}
        {songs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Leader</h2>
            <SongCard
              song={songs[0]}
              onVote={handleVote}
              userHasVotedToday={userHasVotedToday}
              votedSongId={votedSongId}
              isSubmittingVote={isSubmittingVote}
              rank={1}
            />
          </div>
        )}

        {/* Rankings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Live Rankings</h3>
            <div className="badge badge-error gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>

          {songs.length > 1 ? (
            <div className="space-y-3">
              {songs.slice(1).map((song, index) => (
                <SongCard
                  key={song._id}
                  song={song}
                  onVote={handleVote}
                  userHasVotedToday={userHasVotedToday}
                  votedSongId={votedSongId}
                  isSubmittingVote={isSubmittingVote}
                  rank={index + 2}
                />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No songs yet</h3>
              <p className="text-base-content/70 mb-6">Be the first to submit a song</p>
              <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary gap-2">
                <Plus className="w-4 h-4" /> Submit First Song
              </button>
            </div>
          ) : null}
        </div>

        <SubmitSongModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={submitSong}
        />
      </div>
    </div>
  );
};

export default VotingPage;
