import { useState, useEffect } from 'react';
import { 
  Bell, 
  Heart, 
  UserPlus, 
  Calendar, 
  MessageSquare, 
  Check, 
  CheckCheck,
  Trash2 
} from 'lucide-react';
import { useNotificationStore } from '../store/useFollowStore';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'follow':
        return <UserPlus className={`${iconClass} text-blue-500`} />;
      case 'like_post':
        return <Heart className={`${iconClass} text-red-500`} />;
      case 'event_invite':
      case 'event_rsvp':
      case 'new_event_nearby':
        return <Calendar className={`${iconClass} text-green-500`} />;
      case 'message':
        return <MessageSquare className={`${iconClass} text-purple-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'follow':
        return `/profile/${notification.sender.username}`;
      case 'like_post':
        return notification.relatedPost ? `/posts/${notification.relatedPost._id}` : null;
      case 'event_invite':
      case 'event_rsvp':
      case 'new_event_nearby':
        return notification.relatedEvent ? `/events/${notification.relatedEvent._id}` : null;
      case 'message':
        return '/messages';
      default:
        return null;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const NotificationItem = ({ notification }) => {
    const link = getNotificationLink(notification);
    const NotificationContent = () => (
      <div className={`p-4 border-l-4 transition-colors ${
        notification.isRead 
          ? 'border-base-300 bg-base-100' 
          : 'border-primary bg-primary/5'
      }`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="avatar">
                <div className="w-8 h-8 rounded-full">
                  <img 
                    src={notification.sender.profilePic || '/avatar.png'} 
                    alt={notification.sender.fullName}
                  />
                </div>
              </div>
              <span className="font-medium text-sm">
                {notification.sender.fullName}
              </span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
            </div>
            
            <p className="text-sm text-base-content/80 mb-2">
              {notification.message}
            </p>
            
            <div className="text-xs text-base-content/60">
              {formatTime(notification.createdAt)}
            </div>
          </div>

          <div className="flex gap-1">
            {!notification.isRead && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={(e) => handleMarkAsRead(notification._id, e)}
                title="Mark as read"
              >
                <Check className="w-3 h-3" />
              </button>
            )}
            <button
              className="btn btn-ghost btn-xs text-error"
              onClick={(e) => handleDelete(notification._id, e)}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );

    if (link) {
      return (
        <Link to={link} className="block hover:bg-base-200 transition-colors">
          <NotificationContent />
        </Link>
      );
    }

    return <NotificationContent />;
  };

  return (
    <div className="min-h-screen bg-base-200 pt-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-base-content/60">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                className="btn btn-outline btn-sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="tabs tabs-boxed">
            <button
              className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`tab ${filter === 'unread' ? 'tab-active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`tab ${filter === 'read' ? 'tab-active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-base-100 rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-base-200">
              {filteredNotifications.map((notification) => (
                <NotificationItem 
                  key={notification._id} 
                  notification={notification} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
              <p className="text-base-content/60">
                {filter === 'all' 
                  ? "No notifications yet" 
                  : filter === 'unread'
                  ? "No unread notifications"
                  : "No read notifications"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;