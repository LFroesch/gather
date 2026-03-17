import { useEffect, useState } from 'react';
import { useVotingStore } from '../store/useVotingStore';
import { TrendingUp, Users, Music, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="stat bg-base-200 rounded-lg">
    <div className="stat-figure text-primary">
      <Icon className="w-8 h-8" />
    </div>
    <div className="stat-title text-base-content/60">{title}</div>
    <div className="stat-value text-primary">{value}</div>
    {description && <div className="stat-desc">{description}</div>}
  </div>
);

const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
};

const VotingStats = () => {
  const { votingStats, getVotingStats } = useVotingStore();
  const [countdown, setCountdown] = useState(getTimeUntilMidnight);

  useEffect(() => {
    getVotingStats();
  }, [getVotingStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!votingStats) {
    return (
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Loading stats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats shadow w-full bg-base-200 mb-8">
      <StatCard
        title="Today's Votes"
        value={votingStats.today.totalVotes}
        icon={TrendingUp}
        description="Votes cast today"
      />
      <StatCard
        title="Active Voters"
        value={votingStats.today.uniqueVoters}
        icon={Users}
        description="People who voted today"
      />
      <StatCard
        title="All Time Votes"
        value={votingStats.allTime.totalVotes?.toLocaleString() || '0'}
        icon={Music}
        description="Total votes ever"
      />
      <div className="stat bg-base-200 rounded-lg">
        <div className="stat-figure text-secondary">
          <Clock className="w-8 h-8" />
        </div>
        <div className="stat-title text-base-content/60">Voting Resets</div>
        <div className="stat-value text-secondary countdown">
          <span style={{"--value": countdown.hours}}></span>h
          <span style={{"--value": countdown.minutes}}></span>m
        </div>
        <div className="stat-desc">Until midnight reset</div>
      </div>
    </div>
  );
};

export default VotingStats;