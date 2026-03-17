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
  BarChart3,
  UserPlus,
  Flag,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HelpPage = () => {
  const features = [
    {
      icon: Calendar,
      title: "Events",
      description: "Put together a meetup, concert night, or whatever — set the location, invite people, and see who's coming.",
      link: "/create-event",
      color: "red"
    },
    {
      icon: MessageSquare,
      title: "Posts",
      description: "Share what's going on — a quick thought, a photo, or a shoutout for an upcoming event.",
      link: "/create-post",
      color: "blue"
    },
    {
      icon: UserPlus,
      title: "Friends & Follows",
      description: "Follow someone to see their stuff in your feed. Send a friend request if you want to DM them.",
      link: "/",
      color: "green"
    },
    {
      icon: BarChart3,
      title: "Polls",
      description: "Ask your area a question — best pizza spot, what to do this weekend, whatever. Polls need a quick admin approval first.",
      link: "/polls",
      color: "purple"
    },
    {
      icon: Search,
      title: "Search",
      description: "Look up events, posts, or people. You can filter by nearby or just the accounts you follow.",
      link: "/search",
      color: "yellow"
    },
    {
      icon: MessageSquare,
      title: "Messages",
      description: "Chat with friends in real time. You'll need to be friends first (you can change this in settings).",
      link: "/messages",
      color: "pink"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Friend requests, RSVPs, likes, invites — it all shows up here so you don't miss anything.",
      link: "/notifications",
      color: "blue"
    },
    {
      icon: Flag,
      title: "Reporting",
      description: "See something off? Hit the flag icon on any post, event, or profile and we'll take a look.",
      link: "/help",
      color: "red"
    }
  ];

  const quickTips = [
    {
      title: "Set your location",
      description: "Head to Settings and pick your city so you actually see stuff near you."
    },
    {
      title: "Add some friends",
      description: "Send friend requests to unlock messaging. Follow people to get their posts and events in your feed."
    },
    {
      title: "Get involved",
      description: "RSVP to events, vote on polls, like posts — the more you do, the more you'll see."
    },
    {
      title: "Stay safe",
      description: "Meet in public, let someone know your plans, and report anything that feels off."
    }
  ];

  const safetyGuidelines = [
    "Meet in public for first-time hangouts",
    "Tell someone where you're going",
    "Trust your gut — if something feels off, leave",
    "Don't give out personal info too fast",
    "Report anything sketchy right away",
    "Double-check event details before you show up"
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
    <div className="bg-base-300 text-base-content min-h-screen relative z-[2] pt-20">
      <div className="mx-auto container px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center py-16 max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to Gather
          </h1>
          <p className="text-xl text-base-content/70 mb-8 leading-relaxed">
            Find events, share posts, and meet people in your area. Here's how everything works.
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
          <h2 className="text-4xl font-bold mb-8">Jump in</h2>
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
                <p className="text-base-content/80">Go to Settings, find Location Settings, and search for your city. You can also change your radius there if you want to see stuff from farther away (or closer).</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                What's the difference between friends and followers?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">Following is one-way — you'll see their stuff in your feed. Friendship goes both ways and unlocks DMs. You can send a friend request from anyone's profile page.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                How do I message someone?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">By default you need to be friends first — send a request from their profile and once they accept, you're good to go. If you want to let anyone message you, you can turn that on in Settings under Privacy.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                What's the difference between 'Near Me' and 'My Events'?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">"Near Me" is everything within your radius. "My Events" is stuff you've RSVPed to. "Following" shows events from people you follow, regardless of distance.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                How do polls work?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">Anyone can create a poll — pick a question, add up to 4 options, and set how long it lasts. Polls are tied to a location and need a quick approval from a mod before they go live.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100/50">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg font-medium">
                How do I report something?
              </div>
              <div className="collapse-content">
                <p className="text-base-content/80">Hit the flag icon on any event, post, poll, or profile. Tell us what's wrong and a mod will review it.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;