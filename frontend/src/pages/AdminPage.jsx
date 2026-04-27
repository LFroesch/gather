import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Crown,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  UserPlus,
  Flag,
  BarChart3,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldOff
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="card bg-base-200 shadow-lg">
    <div className="card-body p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-base-content/60">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
          {description && <p className="text-xs text-base-content/50">{description}</p>}
        </div>
        <Icon className="w-8 h-8 text-primary" />
      </div>
    </div>
  </div>
);

const UserManagementTab = () => {
  const { users, usersPagination, isLoading, getUsers, updateUserRole, banUser, unbanUser } = useAdminStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getUsers(currentPage, 20, roleFilter, searchTerm);
  }, [currentPage, roleFilter, searchTerm, getUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
    } catch (_) {}
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-warning" />;
      case 'moderator': return <Shield className="w-4 h-4 text-info" />;
      default: return <User className="w-4 h-4 text-base-content/50" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
          <input type="text" placeholder="Search users..." className="input input-bordered w-full pl-10"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <select className="select select-bordered" value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="moderator">Moderators</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center py-8"><span className="loading loading-spinner loading-md"></span></td></tr>
                ) : users.length > 0 ? (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <Link to={`/profile/${user.username}`} className="flex items-center gap-3 hover:opacity-80">
                          <div className="avatar"><div className="w-10 h-10 rounded-full"><img src={user.profilePic || '/avatar.png'} alt={user.username} /></div></div>
                          <div>
                            <div className="font-semibold">{user.username}</div>
                            <div className="text-sm text-base-content/60">{user.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td><div className="flex items-center gap-2">{getRoleIcon(user.role)}<span className="capitalize">{user.role}</span></div></td>
                      <td>
                        {user.isBanned ? (
                          <span className="badge badge-error badge-sm">Banned</span>
                        ) : (
                          <span className="badge badge-success badge-sm">Active</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <select className="select select-sm select-bordered" value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}>
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                          {user.isBanned ? (
                            <button className="btn btn-xs btn-success gap-1" onClick={() => unbanUser(user._id)} title="Unban">
                              <ShieldOff className="w-3 h-3" /> Unban
                            </button>
                          ) : (
                            <button className="btn btn-xs btn-error gap-1" onClick={() => banUser(user._id)} title="Ban">
                              <Ban className="w-3 h-3" /> Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-8">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {usersPagination && usersPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button className="btn btn-sm" disabled={!usersPagination.hasPrev} onClick={() => setCurrentPage(prev => prev - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="btn btn-sm btn-active">{usersPagination.currentPage} / {usersPagination.totalPages}</span>
          <button className="btn btn-sm" disabled={!usersPagination.hasNext} onClick={() => setCurrentPage(prev => prev + 1)}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const SongManagementTab = () => {
  const { songs, songsPagination, isLoading, getSongs, deleteSong, toggleSongStatus } = useAdminStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    getSongs(currentPage, 20, searchTerm, sortBy);
  }, [currentPage, searchTerm, sortBy, getSongs]);

  const handleDelete = async (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      try { await deleteSong(songId); } catch (_) {}
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
          <input type="text" placeholder="Search songs..." className="input input-bordered w-full pl-10"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <select className="select select-bordered" value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
          <option value="createdAt">Newest</option>
          <option value="votes">Most Votes</option>
          <option value="dailyVotes">Daily Votes</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Song</th><th>Artist</th><th>Votes</th><th>Submitted By</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center py-8"><span className="loading loading-spinner loading-md"></span></td></tr>
                ) : songs.length > 0 ? (
                  songs.map(song => (
                    <tr key={song._id}>
                      <td>
                        <div>
                          <div className="font-semibold">{song.title}</div>
                          {song.album && <div className="text-sm text-base-content/60">{song.album}</div>}
                        </div>
                      </td>
                      <td>{song.artist}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold">{song.totalVotes}</span>
                          <span className="text-xs text-base-content/60">{song.dailyVotes} today</span>
                        </div>
                      </td>
                      <td>
                        <Link to={`/profile/${song.submittedBy?.username}`} className="flex items-center gap-2 hover:opacity-80">
                          <div className="avatar"><div className="w-6 h-6 rounded-full"><img src={song.submittedBy?.profilePic || '/avatar.png'} alt="" /></div></div>
                          <span className="text-sm">{song.submittedBy?.username}</span>
                        </Link>
                      </td>
                      <td><div className={`badge ${song.isActive ? 'badge-success' : 'badge-error'}`}>{song.isActive ? 'Active' : 'Inactive'}</div></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-ghost" onClick={() => toggleSongStatus(song._id)}>
                            {song.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDelete(song._id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center py-8">No songs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {songsPagination && songsPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button className="btn btn-sm" disabled={!songsPagination.hasPrev} onClick={() => setCurrentPage(prev => prev - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="btn btn-sm btn-active">{songsPagination.currentPage} / {songsPagination.totalPages}</span>
          <button className="btn btn-sm" disabled={!songsPagination.hasNext} onClick={() => setCurrentPage(prev => prev + 1)}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const PollManagementTab = () => {
  const { adminPolls, adminPollsPagination, isLoading, getAdminPolls, updatePollStatus, deleteAdminPoll } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getAdminPolls(currentPage, statusFilter);
  }, [currentPage, statusFilter, getAdminPolls]);

  const statusBadge = (status) => {
    const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' };
    return <span className={`badge badge-md ${map[status] || 'badge-ghost'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <select className="select select-bordered" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Question</th><th>Creator</th><th>Options</th><th>Votes</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="7" className="text-center py-8"><span className="loading loading-spinner loading-md" /></td></tr>
                ) : adminPolls.length > 0 ? adminPolls.map(poll => (
                  <tr key={poll._id}>
                    <td><span className="font-medium text-sm">{poll.question}</span></td>
                    <td>
                      <Link to={`/profile/${poll.creator?.username}`} className="flex items-center gap-2 hover:opacity-80">
                        <div className="avatar"><div className="w-7 h-7 rounded-full"><img src={poll.creator?.profilePic || '/avatar.png'} alt="" /></div></div>
                        <span className="text-sm">{poll.creator?.username}</span>
                      </Link>
                    </td>
                    <td className="text-sm text-base-content/70">{poll.options.map(o => o.text).join(', ')}</td>
                    <td className="font-semibold">{poll.totalVotes}</td>
                    <td>{statusBadge(poll.status)}</td>
                    <td className="text-xs text-base-content/60">
                      {new Date(poll.expiresAt) <= new Date() ? (
                        <span className="text-error">Expired</span>
                      ) : (
                        new Date(poll.expiresAt).toLocaleDateString()
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {poll.status === 'pending' && (
                          <>
                            <button className="btn btn-xs btn-success gap-1" onClick={() => updatePollStatus(poll._id, 'approved')}>
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                            <button className="btn btn-xs btn-error gap-1" onClick={() => updatePollStatus(poll._id, 'rejected')}>
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {poll.status === 'rejected' && (
                          <button className="btn btn-xs btn-success gap-1" onClick={() => updatePollStatus(poll._id, 'approved')}>
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {poll.status === 'approved' && (
                          <button className="btn btn-xs btn-warning gap-1" onClick={() => updatePollStatus(poll._id, 'rejected')}>
                            <XCircle className="w-3 h-3" /> Revoke
                          </button>
                        )}
                        <button className="btn btn-xs btn-ghost text-error" onClick={() => deleteAdminPoll(poll._id)}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="text-center py-8">No polls found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adminPollsPagination && adminPollsPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button className="btn btn-sm" disabled={!adminPollsPagination.hasPrev} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></button>
          <span className="btn btn-sm btn-active">{adminPollsPagination.currentPage} / {adminPollsPagination.totalPages}</span>
          <button className="btn btn-sm" disabled={!adminPollsPagination.hasNext} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

const ReportsTab = () => {
  const { reports, reportsPagination, isLoading, getReports, reviewReport } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getReports(currentPage, statusFilter);
  }, [currentPage, statusFilter, getReports]);

  const handleReview = async (reportId, status, deleteContent = false, banUser = false) => {
    try {
      await reviewReport(reportId, status, deleteContent, banUser);
    } catch (_) {}
  };

  const getContentLink = (report) => {
    switch (report.contentType) {
      case 'post': return `/posts/${report.contentId}`;
      case 'event': return `/events/${report.contentId}`;
      case 'user': return `/profile/${report.contentId}`;
      default: return null;
    }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge-warning', reviewed: 'badge-success', dismissed: 'badge-ghost' };
    return <span className={`badge badge-sm ${map[status] || 'badge-ghost'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <select className="select select-bordered" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Reporter</th><th>Type</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center py-8"><span className="loading loading-spinner loading-md" /></td></tr>
                ) : reports.length > 0 ? reports.map(report => {
                  const contentLink = getContentLink(report);
                  return (
                    <tr key={report._id}>
                      <td>
                        <Link to={`/profile/${report.reporter?.username}`} className="flex items-center gap-2 hover:opacity-80">
                          <div className="avatar"><div className="w-7 h-7 rounded-full"><img src={report.reporter?.profilePic || '/avatar.png'} alt="" /></div></div>
                          <span className="text-sm">{report.reporter?.username}</span>
                        </Link>
                      </td>
                      <td>
                        {contentLink ? (
                          <Link to={contentLink} className="badge badge-outline badge-sm capitalize hover:badge-primary">
                            {report.contentType}
                          </Link>
                        ) : (
                          <span className="badge badge-outline badge-sm capitalize">{report.contentType}</span>
                        )}
                      </td>
                      <td>
                        <span className="capitalize text-sm">{report.reason}</span>
                        {report.details && <p className="text-xs text-base-content/50 truncate max-w-xs">{report.details}</p>}
                      </td>
                      <td>{statusBadge(report.status)}</td>
                      <td className="text-xs text-base-content/60">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td>
                        {report.status === 'pending' && (
                          <div className="flex gap-1 flex-wrap">
                            <button className="btn btn-xs btn-ghost" onClick={() => handleReview(report._id, 'dismissed')}>Dismiss</button>
                            <button className="btn btn-xs btn-warning" onClick={() => handleReview(report._id, 'reviewed', true)}>Delete Content</button>
                            <button className="btn btn-xs btn-error" onClick={() => handleReview(report._id, 'reviewed', false, true)}>Ban Author</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" className="text-center py-8">No reports found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {reportsPagination && reportsPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button className="btn btn-sm" disabled={!reportsPagination.hasPrev} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></button>
          <span className="btn btn-sm btn-active">{reportsPagination.currentPage} / {reportsPagination.totalPages}</span>
          <button className="btn btn-sm" disabled={!reportsPagination.hasNext} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

const AdminPage = () => {
  const { authUser } = useAuthStore();
  const { dashboardStats, isLoading, getDashboardStats, isAdmin } = useAdminStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (isAdmin(authUser)) {
      getDashboardStats();
    }
  }, [authUser, getDashboardStats, isAdmin]);

  if (!isAdmin(authUser)) {
    return <Navigate to="/events" replace />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'polls', label: 'Polls', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: Flag },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-6xl animate-fade-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-base-content/70">Manage users, content, and monitor platform activity</p>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-6">
          {tabs.map(tab => (
            <button key={tab.id} className={`tab tab-sm sm:tab-lg text-xs sm:text-sm ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon && <tab.icon className="w-4 h-4 mr-1 hidden sm:inline" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg"></span></div>
            ) : dashboardStats ? (
              <>
                {/* Today's Stats */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Today's Activity</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="New Events" value={dashboardStats.today.newEvents || 0} icon={Calendar} />
                    <StatCard title="New Posts" value={dashboardStats.today.newPosts || 0} icon={FileText} />
                    <StatCard title="New Users" value={dashboardStats.today.newUsers || 0} icon={UserPlus} />
                  </div>
                </div>

                {/* All Time Stats */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Users" value={dashboardStats.allTime.totalUsers.toLocaleString()} icon={Users} />
                    <StatCard title="Total Events" value={(dashboardStats.allTime.totalEvents || 0).toLocaleString()} icon={Calendar}
                      description={`${dashboardStats.allTime.upcomingEvents || 0} upcoming`} />
                    <StatCard title="Total Posts" value={(dashboardStats.allTime.totalPosts || 0).toLocaleString()} icon={FileText} />
                    <StatCard title="Total Messages" value={(dashboardStats.allTime.totalMessages || 0).toLocaleString()} icon={MessageSquare} />
                    <StatCard title="Admin Users" value={dashboardStats.allTime.adminUsers} icon={Crown} />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Events */}
                  <div className="card bg-base-200 shadow-lg">
                    <div className="card-body">
                      <h3 className="card-title">Recent Events</h3>
                      <div className="space-y-3">
                        {dashboardStats.recentEvents?.length > 0 ? dashboardStats.recentEvents.map(event => (
                          <Link key={event._id} to={`/events/${event._id}`} className="flex items-center gap-3 text-sm hover:bg-base-300 rounded-lg p-1 -m-1 transition-colors">
                            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                              <p className="font-medium truncate">{event.title}</p>
                              <p className="text-base-content/60 truncate">by {event.creator?.username} &middot; {event.category}</p>
                            </div>
                            <div className="text-xs text-base-content/50 flex-shrink-0">
                              {new Date(event.createdAt).toLocaleDateString()}
                            </div>
                          </Link>
                        )) : <p className="text-base-content/50 text-sm">No events yet</p>}
                      </div>
                    </div>
                  </div>

                  {/* Recent Posts */}
                  <div className="card bg-base-200 shadow-lg">
                    <div className="card-body">
                      <h3 className="card-title">Recent Posts</h3>
                      <div className="space-y-3">
                        {dashboardStats.recentPosts?.length > 0 ? dashboardStats.recentPosts.map(post => (
                          <Link key={post._id} to={`/posts/${post._id}`} className="flex items-center gap-3 text-sm hover:bg-base-300 rounded-lg p-1 -m-1 transition-colors">
                            <FileText className="w-4 h-4 text-secondary flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                              <p className="font-medium truncate">{post.content?.substring(0, 60)}</p>
                              <p className="text-base-content/60 truncate">by {post.author?.username} &middot; {post.likes?.length || 0} likes</p>
                            </div>
                            <div className="text-xs text-base-content/50 flex-shrink-0">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                          </Link>
                        )) : <p className="text-base-content/50 text-sm">No posts yet</p>}
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="text-center py-12"><p>Failed to load dashboard stats</p></div>
            )}
          </div>
        )}

        {activeTab === 'users' && <UserManagementTab />}
        {activeTab === 'polls' && <PollManagementTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
};

export default AdminPage;
