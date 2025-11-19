import { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, MapPin, MessageSquare, Filter, SlidersHorizontal } from 'lucide-react';
import { useEventStore } from '../store/useEventStore';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import PostCard from '../components/PostCard';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [eventFilter, setEventFilter] = useState('nearby');
  const [postFilter, setPostFilter] = useState('following');

  // Event filtering and sorting state
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  const { 
    myEvents, 
    nearbyEvents, 
    getMyEvents, 
    getNearbyEvents, 
    initLocationListener,
    isLoading: eventsLoading 
  } = useEventStore();
  
  const { 
    followingPosts,
    nearbyPosts,
    getFollowingPosts,
    getNearbyPosts,
    initLocationListener: initPostLocationListener,
    isLoading: postsLoading 
  } = usePostStore();

  useEffect(() => {
    const cleanupEvents = initLocationListener();
    const cleanupPosts = initPostLocationListener();
    return () => {
      cleanupEvents();
      cleanupPosts();
    };
  }, [initLocationListener, initPostLocationListener]);

  useEffect(() => {
    if (activeTab === 'events') {
      if (eventFilter === 'my') {
        getMyEvents();
      } else {
        getNearbyEvents();
      }
    } else if (activeTab === 'posts') {
      if (postFilter === 'following') {
        getFollowingPosts();
      } else {
        getNearbyPosts();
      }
    }
  }, [activeTab, eventFilter, postFilter, getMyEvents, getNearbyEvents, getFollowingPosts, getNearbyPosts]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let events = eventFilter === 'nearby' ? nearbyEvents : myEvents;

    // Apply category filter
    if (categoryFilter !== 'all') {
      events = events.filter(event => event.category === categoryFilter);
    }

    // Apply date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      events = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= endOfDay;
      });
    } else if (dateFilter === 'week') {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      events = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= endOfWeek;
      });
    } else if (dateFilter === 'month') {
      const endOfMonth = new Date(now);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      events = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= endOfMonth;
      });
    }

    // Sort events
    const sorted = [...events].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'popularity') {
        const aCount = (a.attendees?.yes?.length || 0) + (a.attendees?.maybe?.length || 0);
        const bCount = (b.attendees?.yes?.length || 0) + (b.attendees?.maybe?.length || 0);
        return bCount - aCount;
      } else if (sortBy === 'distance') {
        return (a.distance || 0) - (b.distance || 0);
      }
      return 0;
    });

    return sorted;
  }, [nearbyEvents, myEvents, eventFilter, categoryFilter, dateFilter, sortBy]);

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'posts', label: 'Posts', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-base-200 pt-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-100 shadow-lg mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab tab-lg gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Event Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${eventFilter === 'nearby' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setEventFilter('nearby')}
              >
                <MapPin className="w-4 h-4" />
                Events Near Me
              </button>
              <button
                className={`btn btn-sm ${eventFilter === 'my' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setEventFilter('my')}
              >
                <Calendar className="w-4 h-4" />
                My Events
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="bg-base-100 rounded-lg p-4 shadow space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="w-4 h-4" />
                Filters & Sort
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="label label-text text-xs">Category</label>
                  <select
                    className="select select-sm select-bordered w-full"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="social">Social</option>
                    <option value="professional">Professional</option>
                    <option value="educational">Educational</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="sports">Sports</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="label label-text text-xs">Date Range</label>
                  <select
                    className="select select-sm select-bordered w-full"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Upcoming</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="label label-text text-xs">Sort By</label>
                  <select
                    className="select select-sm select-bordered w-full"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date">Date (Soonest)</option>
                    <option value="popularity">Popularity</option>
                    {eventFilter === 'nearby' && <option value="distance">Distance</option>}
                  </select>
                </div>
              </div>

              {/* Active filters indicator */}
              {(categoryFilter !== 'all' || dateFilter !== 'all') && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-base-content/60">Active filters:</span>
                  {categoryFilter !== 'all' && (
                    <span className="badge badge-sm badge-primary gap-1">
                      {categoryFilter}
                      <button onClick={() => setCategoryFilter('all')}>✕</button>
                    </span>
                  )}
                  {dateFilter !== 'all' && (
                    <span className="badge badge-sm badge-primary gap-1">
                      {dateFilter}
                      <button onClick={() => setDateFilter('all')}>✕</button>
                    </span>
                  )}
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setCategoryFilter('all');
                      setDateFilter('all');
                    }}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {filteredAndSortedEvents.length > 0 ? (
                    <>
                      <div className="text-sm text-base-content/60 mb-2">
                        Showing {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? 's' : ''}
                      </div>
                      {filteredAndSortedEvents.map((event) => (
                        <EventCard
                          key={event._id}
                          event={event}
                          showRSVPStatus={eventFilter === 'my'}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-base-content/60">
                        {eventFilter === 'my'
                          ? "You haven't RSVPd to any events yet"
                          : "No events found matching your filters"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Following Tab */}
        {activeTab === 'following' && (
          <div className="space-y-4">
            {postsLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <>
                {followingPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
                {followingPosts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-base-content/60">
                      No posts from people you follow yet
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Post Filter */}
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${postFilter === 'following' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPostFilter('following')}
              >
                <Users className="w-4 h-4" />
                Following
              </button>
              <button
                className={`btn btn-sm ${postFilter === 'nearby' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPostFilter('nearby')}
              >
                <MapPin className="w-4 h-4" />
                Posts Near Me
              </button>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {postFilter === 'following' && followingPosts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                  {postFilter === 'nearby' && nearbyPosts.map((post) => (
                    <PostCard key={post._id} post={post} showDistance />
                  ))}
                  {((postFilter === 'following' && followingPosts.length === 0) ||
                    (postFilter === 'nearby' && nearbyPosts.length === 0)) && (
                    <div className="text-center py-8">
                      <p className="text-base-content/60">
                        {postFilter === 'following' 
                          ? "No posts from people you follow yet" 
                          : "No posts found nearby"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;