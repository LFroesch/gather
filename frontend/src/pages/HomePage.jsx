import { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, MessageSquare } from 'lucide-react';
import { useEventStore } from '../store/useEventStore';
import { usePostStore } from '../store/usePostStore';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import PostCard from '../components/PostCard';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [eventFilter, setEventFilter] = useState('nearby');
  const [postFilter, setPostFilter] = useState('following');
  
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
            <div className="flex gap-2">
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

            {/* Events List */}
            <div className="space-y-4">
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {eventFilter === 'nearby' && nearbyEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                  {eventFilter === 'my' && myEvents.map((event) => (
                    <EventCard key={event._id} event={event} showRSVPStatus />
                  ))}
                  {((eventFilter === 'nearby' && nearbyEvents.length === 0) ||
                    (eventFilter === 'my' && myEvents.length === 0)) && (
                    <div className="text-center py-8">
                      <p className="text-base-content/60">
                        {eventFilter === 'my' 
                          ? "You haven't RSVPd to any events yet" 
                          : "No events found nearby"}
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