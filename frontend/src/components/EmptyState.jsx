import { Inbox, Calendar, Users, MessageCircle, Bell, Search } from 'lucide-react';

const EmptyState = ({
  type = "default",
  title,
  message,
  actionLabel,
  onAction
}) => {
  const icons = {
    events: Calendar,
    users: Users,
    messages: MessageCircle,
    notifications: Bell,
    posts: Inbox,
    search: Search,
    default: Inbox
  };

  const Icon = icons[type] || icons.default;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-base-200 rounded-full p-6 mb-4">
        <Icon className="w-12 h-12 text-base-content/40" />
      </div>

      <h3 className="text-xl font-semibold mb-2">
        {title || "Nothing here yet"}
      </h3>

      <p className="text-base-content/60 max-w-md mb-6">
        {message || "It looks like there's nothing to show right now."}
      </p>

      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
