import { useEffect, useState } from 'react';
import { useVotingStore } from '../store/useVotingStore';
import { Trophy, Calendar, Music, TrendingUp, Crown, Medal, Award } from 'lucide-react';

const ChartCard = ({ song, rank, isLive = false }) => {
  const title = song.songId?.title || song.title;
  const artist = song.songId?.artist || song.artist;
  const album = song.songId?.album || song.album;
  const votes = song.votes || song.dailyVoteCount || 0;

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
    <div className={`card bg-base-200 shadow-md ${getRankBorder(rank)} ${isLive ? 'ring-1 ring-primary/30' : ''}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{getRankIcon(rank)}</div>
          <div className="flex-grow min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate">{title}</h3>
            <p className="text-base-content/70 truncate">{artist}</p>
            {album && <p className="text-sm text-base-content/50 truncate">{album}</p>}
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-primary">{votes}</div>
            <div className="text-xs text-base-content/60">votes</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartsPage = () => {
  const { dailyChart, isLoading, getDailyChart, songs, getTodaysSongs } = useVotingStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('today');

  useEffect(() => {
    if (viewMode === 'today') {
      getTodaysSongs();
    } else {
      getDailyChart(selectedDate);
    }
  }, [viewMode, selectedDate, getDailyChart, getTodaysSongs]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const sortedSongs = songs
    ? [...songs].sort((a, b) => (b.dailyVoteCount || 0) - (a.dailyVoteCount || 0))
    : [];

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
          <h1 className="text-4xl font-bold mb-2">Music Charts</h1>
          <p className="text-lg text-base-content/70">Daily winners and music rankings</p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="join">
            <button
              className={`btn join-item ${viewMode === 'today' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('today')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Live Today
            </button>
            <button
              className={`btn join-item ${viewMode === 'historical' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('historical')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Historical
            </button>
          </div>
        </div>

        {/* Today View */}
        {viewMode === 'today' && (
          <div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="badge badge-primary badge-lg gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                LIVE RANKINGS
              </div>
            </div>

            {sortedSongs.length > 0 ? (
              <div className="space-y-3">
                {sortedSongs.map((song, index) => (
                  <ChartCard key={song._id} song={song} rank={index + 1} isLive />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No votes yet today</h3>
                <p className="text-base-content/70">Be the first to vote!</p>
              </div>
            )}
          </div>
        )}

        {/* Historical View */}
        {viewMode === 'historical' && (
          <div>
            <div className="flex justify-center mb-6">
              <input
                type="date"
                className="input input-bordered"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {isToday ? "Today's Chart" : formatDate(selectedDate)}
              </h2>
              {dailyChart && (
                <div className="flex justify-center gap-4 text-sm text-base-content/70">
                  <span>{dailyChart.totalVotes} total votes</span>
                  <span>{dailyChart.uniqueVoters} unique voters</span>
                  <span>{dailyChart.songs?.length || 0} songs</span>
                </div>
              )}
            </div>

            {dailyChart?.songs && dailyChart.songs.length > 0 ? (
              <div className="space-y-3">
                {dailyChart.songs.map((song, index) => (
                  <ChartCard key={song.songId?._id || index} song={song} rank={index + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No chart data</h3>
                <p className="text-base-content/70">
                  {isToday ? 'No votes cast yet today' : 'No votes were cast on this date'}
                </p>
              </div>
            )}

            {/* Day Navigation */}
            <div className="flex justify-center gap-2 mt-8">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev.toISOString().split('T')[0]);
                }}
              >
                Previous Day
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setSelectedDate(todayStr)}
              >
                Today
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  const newDate = next.toISOString().split('T')[0];
                  if (newDate <= todayStr) setSelectedDate(newDate);
                }}
                disabled={selectedDate >= todayStr}
              >
                Next Day
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsPage;
