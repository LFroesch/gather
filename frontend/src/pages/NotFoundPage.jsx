import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-primary">404</h1>
        <p className="text-2xl font-semibold mt-4">Page not found</p>
        <p className="text-base-content/60 mt-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/events" className="btn btn-primary mt-6 gap-2">
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
