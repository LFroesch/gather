import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Edit } from "lucide-react";
import EditProfileModal from "../components/EditProfileModal";
import { useEventStore } from '../store/useEventStore';
import { usePostStore } from '../store/usePostStore';
import EventCard from '../components/EventCard';
import PostCard from '../components/PostCard';

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const { myEvents, getMyEvents, isLoading: eventsLoading } = useEventStore();
  const { getMyPosts, myPosts, isLoading: postsLoading } = usePostStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  // Add a loading state for when authUser is not fully loaded
  if (!authUser) {
    return (
      <div className="pt-20">
        <div className="max-w-2xl mx-auto p-4 py-8">
          <div className="bg-base-300 rounded-xl p-6 space-y-8">
            <div className="text-center">
              <div className="skeleton h-8 w-32 mx-auto mb-2"></div>
              <div className="skeleton h-4 w-48 mx-auto"></div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="skeleton size-32 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch data when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'posts') {
      getMyPosts(); // Changed from getUserPosts(authUser._id)
    } else if (tab === 'events') {
      getMyEvents();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
            <button 
              className="btn btn-outline btn-sm mt-2"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </div>
            <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </div>
            <p className="px-4 py-2.5 bg-base-200 rounded-lg border">@{authUser?.username}</p>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </div>
            <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
          </div>

          {authUser?.bio && (
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Bio</div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser.bio}</p>
            </div>
          )}

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span className="bg-base-200 px-3 py-1 rounded">
                  {authUser?.createdAt ? authUser.createdAt.split("T")[0] : "Loading..."}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-lg mb-6 mt-6">
          <button
            className={`tab tab-lg ${activeTab === 'posts' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            Posts
          </button>
          <button
            className={`tab tab-lg ${activeTab === 'events' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('events')}
          >
            Events
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'posts' && (
            <>
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {myPosts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                  {myPosts.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-base-content/60">
                        You haven't posted anything yet
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'events' && (
            <>
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {myEvents.map((event) => (
                    <EventCard key={event._id} event={event} showRSVPStatus />
                  ))}
                  {myEvents.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-base-content/60">
                        You haven't RSVP'd to any events yet
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentUser={authUser}
          onUpdate={updateProfile}
        />
      </div>
    </div>
  );
};
export default ProfilePage;