import { AlertCircle } from 'lucide-react';

const ErrorState = ({
  title = "Something went wrong",
  message = "We encountered an error. Please try again.",
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-error/10 rounded-full p-6 mb-4">
        <AlertCircle className="w-12 h-12 text-error" />
      </div>

      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-base-content/60 max-w-md mb-6">{message}</p>

      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary btn-sm">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
