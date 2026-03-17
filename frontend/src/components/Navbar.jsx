import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Bell, Plus, Calendar, HelpCircle, BarChart3, Shield, Palette, FileText, Search } from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { useNotificationStore } from "../store/useFollowStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { logout, authUser, onlineUsers, socket } = useAuthStore();
  const { isAdmin } = useAdminStore();
  const { unreadCount, getNotifications, addNotification } = useNotificationStore();
  const { totalUnreadMessages, getUnreadCounts } = useChatStore();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Fetch notifications + unread message counts on mount
  useEffect(() => {
    if (!authUser) return;
    getNotifications();
    getUnreadCounts();
  }, [authUser, getNotifications, getUnreadCounts]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      addNotification(notification);
    };

    // Refresh unread message count when a new message arrives (and we're not viewing that chat)
    const handleNewMessage = () => {
      getUnreadCounts();
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, addNotification, getUnreadCounts]);

  // Total online users (excluding self)
  const totalOnline = onlineUsers.length > 0 ? onlineUsers.length : 0;

  const mobileNavItems = [
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/posts', icon: FileText, label: 'Posts' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/messages', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <>
    <header
      className="bg-base-100 border-b-2 border-base-300 fixed w-full top-0 z-40
    backdrop-blur-lg bg-base-100/85"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to='/events' className="flex items-center bg-primary rounded-lg px-3 py-1 gap-1 flex-shrink-0">
            <img src='/gather.svg' alt='Gather Logo' className='w-24 sm:w-28 lg:w-32' />
          </Link>

          {/* Center Navigation (only show when logged in, xl+ to avoid cramping) */}
          {authUser && (
            <nav className="hidden xl:flex items-center gap-1">
              <Link to="/events" className={`btn btn-ghost btn-sm ${location.pathname === '/events' ? 'nav-active' : ''}`}>
                <Calendar className="w-4 h-4" />
                Events
              </Link>
              <Link to="/posts" className={`btn btn-ghost btn-sm ${location.pathname === '/posts' ? 'nav-active' : ''}`}>
                <FileText className="w-4 h-4" />
                Posts
              </Link>
              <Link to="/notifications" className={`btn btn-ghost btn-sm ${location.pathname === '/notifications' ? 'nav-active' : ''}`}>
                <div className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 badge badge-primary badge-xs text-[10px] px-1 min-w-[16px]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                Notifications
              </Link>
              <Link to="/messages" className={`btn btn-ghost btn-sm ${location.pathname === '/messages' ? 'nav-active' : ''}`}>
                <div className="relative">
                  <MessageSquare className="w-4 h-4" />
                  {totalUnreadMessages > 0 && (
                    <span className="absolute -top-2 -right-2 badge badge-primary badge-xs text-[10px] px-1 min-w-[16px]">
                      {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                    </span>
                  )}
                </div>
                Messages
              </Link>
              <Link to="/polls" className={`btn btn-ghost btn-sm ${location.pathname === '/polls' ? 'nav-active' : ''}`}>
                <BarChart3 className="w-4 h-4" />
                Polls
              </Link>
            </nav>
          )}

          {/* Search Bar — only on xl+ to avoid overlap */}
          {authUser && (
            <form onSubmit={handleSearch} className="hidden xl:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Search..."
                className="input input-bordered input-sm w-44 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {authUser && totalOnline > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-base-content/60 px-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {totalOnline} online
              </div>
            )}

            <Link
              to="/settings"
              state={{ section: 'theme' }}
              className="btn btn-ghost btn-circle btn-md"
              aria-label="Theme settings"
            >
              <Palette className="w-5 h-5" />
            </Link>

            {authUser && (
              <>
                {/* Create Dropdown */}
                <div className="dropdown dropdown-end">
                  <button
                    tabIndex={0}
                    className="btn btn-primary btn-md p-2 gap-2"
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create</span>
                  </button>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
                    <li>
                      <Link to="/create-event" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        New Event
                      </Link>
                    </li>
                    <li>
                      <Link to="/create-post" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        New Post
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Profile Menu */}
                <div className="dropdown dropdown-end">
                  <button tabIndex={0} className="btn btn-ghost btn-circle avatar">
                    <div className="w-8 h-8 rounded-full">
                      <img src={authUser.profilePic || "/avatar.png"} alt="Profile" />
                    </div>
                  </button>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
                    <li>
                      <Link to="/profile" className="gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link to="/settings" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </li>
                    {isAdmin(authUser) && (
                      <li>
                        <Link to="/admin" className="gap-2">
                          <Shield className="w-4 h-4" />
                          Admin
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link to="/help" className="gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Help
                      </Link>
                    </li>
                    <li>
                      <button onClick={logout} className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {!authUser && (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Nav */}
    {authUser && (
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-100 border-t border-base-300 safe-area-pb">
        <div className="flex justify-around items-center h-14">
          {mobileNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            const showBadge = (to === '/notifications' && unreadCount > 0)
              || (to === '/messages' && totalUnreadMessages > 0);
            const badgeCount = to === '/notifications' ? unreadCount : totalUnreadMessages;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-base-content/60'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 badge badge-primary badge-xs text-[10px] px-1 min-w-[14px]">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    )}
    </>
  );
};
export default Navbar;