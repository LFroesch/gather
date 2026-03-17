import { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, MapPin, MessageSquare } from 'lucide-react';
import { useEventStore } from '../store/useEventStore';
import { usePostStore } from '../store/usePostStore';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import EventCard from '../components/EventCard';
import PostCard from '../components/PostCard';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'professional', label: 'Professional' },
  { id: 'educational', label: 'Educational' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'sports', label: 'Sports' },
  { id: 'concert', label: 'Concert' },
  { id: 'food', label: 'Food & Drink' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'community', label: 'Community' },
  { id: 'other', label: 'Other' },
];

const HomePage = () => {
  const location = useLocation();
  const activeTab = location.pathname === '/posts' ? 'posts' : 'events';
  const [searchParams, setSearchParams] = useSearchParams();

  const eventFilter = searchParams.get('events') || 'nearby';
  const postFilter = searchParams.get('posts') || 'nearby';
  const categoryFilter = searchParams.get('category') || 'all';
  const timeFilter = searchParams.get('time') || 'upcoming';
  const eventSort = searchParams.get('esort') || 'date';
  const postSort = searchParams.get('psort') || 'newest';
  const postTimeFilter = searchParams.get('ptime') || 'all';

  const setParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    });
  };

  const [eventsPage, setEventsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);

  const {
    myEvents, nearbyEvents, followingEvents,
    getMyEvents, getNearbyEvents, getFollowingEvents,
    initLocationListener, isLoading: eventsLoading,
    hasMore: eventsHasMore
  } = useEventStore();

  const {
    followingPosts, nearbyPosts,
    getFollowingPosts, getNearbyPosts,
    initLocationListener: initPostLocationListener,
    isLoading: postsLoading,
    hasMore: postsHasMore
  } = usePostStore();

  useEffect(() => {
    const cleanupEvents = initLocationListener();
    const cleanupPosts = initPostLocationListener();
    return () => { cleanupEvents(); cleanupPosts(); };
  }, [initLocationListener, initPostLocationListener]);

  // Reset page when filter changes
  useEffect(() => { setEventsPage(1); }, [eventFilter]);
  useEffect(() => { setPostsPage(1); }, [postFilter]);

  useEffect(() => {
    if (activeTab === 'events') {
      if (eventFilter === 'my') getMyEvents(eventsPage);
      else if (eventFilter === 'following') getFollowingEvents(eventsPage);
      else getNearbyEvents(eventsPage);
    } else {
      if (postFilter === 'following') getFollowingPosts(postsPage);
      else getNearbyPosts(postsPage);
    }
  }, [activeTab, eventFilter, postFilter, eventsPage, postsPage, getMyEvents, getNearbyEvents, getFollowingEvents, getFollowingPosts, getNearbyPosts]);

  // Client-side filter + sort for events
  const rawEvents = eventFilter === 'my' ? myEvents : eventFilter === 'following' ? followingEvents : nearbyEvents;
  const filteredEvents = useMemo(() => {
    const now = new Date();
    let list = rawEvents.filter(e => categoryFilter === 'all' || e.category === categoryFilter);

    if (timeFilter === 'upcoming') {
      list = list.filter(e => new Date(e.date) >= now);
    } else if (timeFilter === 'this-week') {
      const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59, 999);
      list = list.filter(e => { const d = new Date(e.date); return d >= now && d <= endOfWeek; });
    } else if (timeFilter === 'this-weekend') {
      const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
      const fri = new Date(now);
      if (day === 0) {
        // It's Sunday — weekend is today
        fri.setDate(now.getDate() - 2); // back to Friday
      } else if (day === 6) {
        // It's Saturday — weekend started yesterday
        fri.setDate(now.getDate() - 1);
      } else {
        // Mon-Fri — weekend is upcoming Friday
        fri.setDate(now.getDate() + (5 - day));
      }
      fri.setHours(0, 0, 0, 0);
      const sun = new Date(fri);
      sun.setDate(fri.getDate() + 2);
      sun.setHours(23, 59, 59, 999);
      const start = fri < now ? now : fri;
      list = list.filter(e => { const d = new Date(e.date); return d >= start && d <= sun; });
    } else if (timeFilter === 'this-month') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      list = list.filter(e => { const d = new Date(e.date); return d >= now && d <= endOfMonth; });
    } else if (timeFilter === 'past') {
      list = list.filter(e => new Date(e.date) < now);
    }

    const sorted = [...list];
    if (eventSort === 'date') {
      if (timeFilter === 'past' || timeFilter === 'all') sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      else sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    else if (eventSort === 'distance') sorted.sort((a, b) => (a.distanceInMiles || 0) - (b.distanceInMiles || 0));
    else if (eventSort === 'popular') sorted.sort((a, b) => (b.attendeeCount || 0) - (a.attendeeCount || 0));
    return sorted;
  }, [rawEvents, categoryFilter, timeFilter, eventSort]);

  // Client-side filter + sort for posts
  const rawPosts = postFilter === 'following' ? followingPosts : nearbyPosts;
  const filteredPosts = useMemo(() => {
    const now = new Date();
    let list = [...rawPosts];

    if (postTimeFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      list = list.filter(p => new Date(p.createdAt) >= startOfDay);
    } else if (postTimeFilter === 'this-week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter(p => new Date(p.createdAt) >= sevenDaysAgo);
    } else if (postTimeFilter === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter(p => new Date(p.createdAt) >= startOfMonth);
    }

    if (postSort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (postSort === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (postSort === 'distance') list.sort((a, b) => (a.distanceInMiles || 0) - (b.distanceInMiles || 0));
    else if (postSort === 'popular') list.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    return list;
  }, [rawPosts, postSort, postTimeFilter]);

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-4xl animate-fade-up">

        {/* Events Page */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Feed tabs */}
            <div className="flex justify-center">
              <div className="tabs tabs-boxed bg-base-100 shadow border-2 border-base-300 font-bold">
                {[
                  { id: 'nearby', label: 'Near Me', icon: MapPin },
                  { id: 'following', label: 'Following', icon: Users },
                  { id: 'my', label: 'My Events', icon: Calendar },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`tab gap-2 ${eventFilter === id ? 'tab-active' : ''}`}
                    onClick={() => setParam('events', id)}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <select className="select select-bordered select-sm" value={categoryFilter} onChange={(e) => setParam('category', e.target.value)}>
                {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
              <select className="select select-bordered select-sm" value={timeFilter} onChange={(e) => setParam('time', e.target.value)}>
                <option value="upcoming">Upcoming</option>
                <option value="this-week">This Week</option>
                <option value="this-weekend">This Weekend</option>
                <option value="this-month">This Month</option>
                <option value="past">Past</option>
                <option value="all">All Time</option>
              </select>
              <select className="select select-bordered select-sm" value={eventSort} onChange={(e) => setParam('esort', e.target.value)}>
                <option value="date">{timeFilter === 'past' || timeFilter === 'all' ? 'Newest' : 'Soonest'}</option>
                <option value="distance">Nearest</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Events list */}
            <div className="space-y-4">
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard key={event._id} event={event} showRSVPStatus={eventFilter === 'my'} />
                ))
              ) : (
                <div className="text-center py-16">
                  <Calendar className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">
                    {eventFilter === 'my' ? "No events yet" : eventFilter === 'following' ? "No events from people you follow" : "Nothing nearby"}
                  </h3>
                  <p className="text-base-content/60 mb-4">
                    {eventFilter === 'my'
                      ? "RSVP to events and they'll show up here"
                      : eventFilter === 'following'
                        ? "Follow people to see their events here"
                        : "No events found in your area — try creating one!"}
                  </p>
                  <Link to="/create-event" className="btn btn-primary btn-sm">Create Event</Link>
                </div>
              )}
              {eventsHasMore && !eventsLoading && (
                <div className="flex justify-center pt-2">
                  <button className="btn btn-outline btn-sm" onClick={() => setEventsPage((p) => p + 1)}>
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Posts Page */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {/* Feed tabs */}
            <div className="flex justify-center">
              <div className="tabs tabs-boxed bg-base-100 shadow border-2 border-base-300 font-bold">
                {[
                  { id: 'nearby', label: 'Near Me', icon: MapPin },
                  { id: 'following', label: 'Following', icon: Users },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`tab gap-2 ${postFilter === id ? 'tab-active' : ''}`}
                    onClick={() => setParam('posts', id)}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <select className="select select-bordered select-sm" value={postTimeFilter} onChange={(e) => setParam('ptime', e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
              <select className="select select-bordered select-sm" value={postSort} onChange={(e) => setParam('psort', e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="distance">Nearest</option>
                <option value="popular">Most Liked</option>
              </select>
            </div>

            {/* Posts list */}
            <div className="space-y-4">
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard key={post._id} post={post} showDistance={postFilter === 'nearby'} />
                ))
              ) : (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">
                    {postFilter === 'following' ? "No posts yet" : "Nothing nearby"}
                  </h3>
                  <p className="text-base-content/60 mb-4">
                    {postFilter === 'following'
                      ? "Follow people to see their posts here"
                      : "No posts found in your area — be the first!"}
                  </p>
                  <Link to="/create-post" className="btn btn-primary btn-sm">Create Post</Link>
                </div>
              )}
              {postsHasMore && !postsLoading && (
                <div className="flex justify-center pt-2">
                  <button className="btn btn-outline btn-sm" onClick={() => setPostsPage((p) => p + 1)}>
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
