import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Bell, Plus, Calendar } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <header
      className="bg-base-100 border-b border-base-300 lg:fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to='/' className="flex items-center">
            <MessageSquare className="w-5 h-5 text-primary mr-2" />
            <img src='/event-chat.svg' alt='Event Chat Logo' className='w-60 sm:w-40' />
          </Link>

          {/* Center Navigation (only show when logged in) */}
          {authUser && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="btn btn-ghost btn-sm">
                Home
              </Link>
              <Link to="/notifications" className="btn btn-ghost btn-sm">
                <Bell className="w-4 h-4" />
                Notifications
              </Link>
              <Link to="/messages" className="btn btn-ghost btn-sm">
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
            </nav>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {authUser && (
              <>
                {/* Create Dropdown */}
                <div className="dropdown dropdown-end">
                  <button
                    tabIndex={0}
                    className="btn btn-primary btn-sm gap-2"
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
  );
};
export default Navbar;