import { Calendar, MapPin, MessageSquare, Users } from 'lucide-react';

const features = [
  { icon: Calendar, text: "Find local events" },
  { icon: MapPin, text: "Discover what's nearby" },
  { icon: MessageSquare, text: "Chat in real time" },
  { icon: Users, text: "Build your community" },
];

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <div className="flex flex-col gap-3 mb-8">
          {features.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 bg-base-100 rounded-lg px-4 py-3 text-left"
            >
              <Icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-base-content/80">{text}</span>
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-base-content/60 text-sm">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
