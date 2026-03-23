import { useEffect, useState, useCallback, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, X } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, searchAllUsers, perUserUnread, getUnreadCounts } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    getUsers();
    getUnreadCounts();
  }, [getUsers, getUnreadCounts]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timeoutRef.current = setTimeout(async () => {
      const results = await searchAllUsers(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  }, [searchAllUsers]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : users;
  const filteredUsers = (showOnlineOnly
    ? displayUsers.filter((user) => onlineUsers.includes(user._id))
    : displayUsers
  ).toSorted((a, b) => {
    // Unread messages first
    const unreadDiff = (perUserUnread[b._id] || 0) - (perUserUnread[a._id] || 0);
    if (unreadDiff !== 0) return unreadDiff;
    // Then by most recent message
    return (new Date(b.lastMessageAt || 0)) - (new Date(a.lastMessageAt || 0));
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* Search input */}
        <div className="mt-3 hidden lg:block relative">
          <input
            type="text"
            placeholder="Search users..."
            className="input input-bordered input-sm w-full pr-8"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery ? (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="w-4 h-4 text-base-content/60" />
            </button>
          ) : (
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          )}
        </div>

        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-base-content/50">({displayUsers.filter((u) => onlineUsers.includes(u._id)).length} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {isSearching && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}

        {!isSearching && filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500
                  rounded-full ring-2 ring-base-100"
                />
              )}
              {perUserUnread[user._id] > 0 && (
                <span className="absolute -top-1 -right-1 badge badge-primary badge-xs text-[10px] px-1 min-w-[16px] lg:hidden">
                  {perUserUnread[user._id]}
                </span>
              )}
            </div>

            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className="font-medium truncate">@{user.username}</div>
              <div className="text-sm text-base-content/50">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>

            {perUserUnread[user._id] > 0 && (
              <span className="badge badge-primary badge-sm hidden lg:inline-flex">
                {perUserUnread[user._id]}
              </span>
            )}
          </button>
        ))}

        {!isSearching && filteredUsers.length === 0 && (
          <div className="text-center text-base-content/50 py-4">
            {searchQuery.length >= 2 ? "No users found" : "No friends yet"}
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
