import { 
  Calendar, 
  MessageSquare, 
  Users, 
  MapPin, 
  Settings,
  Plus,
  Bell,
  Search,
  Shield,
  Play,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HelpPage = () => {
  const features = [
    {
      icon: Calendar,
      title: "Create Events",
      description: "Host local gatherings, meetups, and activities. Set location, invite friends, and build your community.",
      link: "/create-event",
      color: "red"
    },
    {
      icon: MessageSquare,
      title: "Share Posts",
      description: "Connect with your local community through posts. Share updates, photos, and link to your events.",
      link: "/create-post",
      color: "blue"
    },
    {
      icon: Users,
      title: "Follow & Connect",
      description: "Follow interesting people in your area. See their posts and events in your personalized feed.",
      link: "/",
      color: "green"
    },
    {
      icon: MapPin,
      title: "Discover Nearby",
      description: "Find events and posts from people near you. Adjust your discovery radius to explore your area.",
      link: "/settings",
      color: "purple"
    },
    {
      icon: Bell,
      title: "Stay Updated",
      description: "Get notified about new followers, event invites, post likes, and nearby community activity.",
      link: "/notifications",
      color: "yellow"
    },
    {
      icon: MessageSquare,
      title: "Direct Messages",
      description: "Chat privately with other community members. Coordinate events and build meaningful connections.",
      link: "/messages",
      color: "pink"
    }
  ];

  const quickTips = [
    {
      title: "Set Your Location",
      description: "Update your location in settings to discover relevant local content and events."
    },
    {
      title: "Use Clear Titles",
      description: "Make your events and posts discoverable with descriptive, engaging titles."
    },
    {
      title: "Engage Actively",
      description: "Like posts, RSVP to events, and follow interesting people to build your network."
    },
    {
      title: "Stay Safe",
      description: "Always meet in public places and trust your instincts when attending events."
    }
  ];

  const safetyGuidelines = [
    "Meet in public places for first-time meetups",
    "Share your plans with someone you trust",
    "Trust your instincts - leave if something feels wrong",
    "Don't share personal information too quickly",
    "Report inappropriate behavior immediately",
    "Verify event details before attending"
  ];

  const getColorClasses = (color) => {
    const colors = {
      red: {
        border: "hover:border-red-500",
        icon: "text-red-500 group-hover:text-red-400",
        title: "group-hover:text-red-400"
      },
      blue: {
        border: "hover:border-blue-500",
        icon: "text-blue-500 group-hover:text-blue-400",
        title: "group-hover:text-blue-400"
      },
      green: {
        border: "hover:border-green-500",
        icon: "text-green-500 group-hover:text-green-400",
        title: "group-hover:text-green-400"
      },
      purple: {
        border: "hover:border-purple-500",
        icon: "text-purple-500 group-hover:text-purple-400",
        title: "group-hover:text-purple-400"
      },
      yellow: {
        border: "hover:border-yellow-500",
        icon: "text-yellow-500 group-hover:text-yellow-400",
        title: "group-hover:text-yellow-400"
      },
      pink: {
        border: "hover:border-pink-500",
        icon: "text-pink-500 group-hover:text-pink-400",
        title: "group-hover:text-pink-400"
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-base-300 text-base-content min-h-screen pt-20">
      <div className="mx-auto container px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center py-16 max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to EventChat
          </h1>
          <p className="text-xl text-base-content/70 mb-8 leading-relaxed">
            Connect with your local community through events and social posts. 
            Your neighborhood network starts here.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses = getColorClasses(feature.color);
            
            return (
              <Link key={index} to={feature.link}>
                <div className={`bg-base-100/50 p-8 rounded-xl border border-base-content/10 ${colorClasses.border} transition-all duration-300 hover:scale-105 group cursor-pointer h-full flex flex-col backdrop-blur-sm`}>
                  <div className="flex items-center mb-4">
                    <Icon className={`${colorClasses.icon} mr-3 transition-colors`} size={32} />
                    <h3 className={`text-2xl font-semibold ${colorClasses.title} transition-colors`}>
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-base-content/60 leading-relaxed flex-grow">
                    {feature.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Start Section */}
        <div className="text-center py-12 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Ready to Get Started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/create-event" 
              className="btn btn-primary btn-lg gap-3 transform hover:scale-105 transition-all duration-300"
            >
              <Plus size={24} />
              Create Your First Event
            </Link>
            <Link 
              to="/settings" 
              className="btn btn-outline btn-lg gap-3 transform hover:scale-105 transition-all duration-300"
            >
              <Settings size={24} />
              Set Your Location
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto bg-base-100/30 rounded-xl p-8 border border-base-content/10 backdrop-blur-sm">
          <h3 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                How do I change my location?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">Go to Settings → Location Settings and search for your city. You can also adjust your search radius to see content from a wider or smaller area.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                Can I make private events?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">Yes! When creating an event, check the 'Make this event private' option. Private events are invite-only and won't appear in public searches.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                How do I invite people to my event?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">On the event page, click the 'Invite' button. You can select from your contacts or people who are already attending the event.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                What's the difference between 'Events Near Me' and 'My Events'?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">'Events Near Me' shows all public events in your area. 'My Events' shows only events you've RSVPed 'yes' to.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;