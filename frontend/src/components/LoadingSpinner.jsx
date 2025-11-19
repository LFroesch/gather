const LoadingSpinner = ({ size = "lg", message = "" }) => {
  const sizeClasses = {
    sm: "loading-sm",
    md: "loading-md",
    lg: "loading-lg",
    xl: "loading-lg scale-150"
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <span className={`loading loading-spinner ${sizeClasses[size]} text-primary`}></span>
      {message && <p className="text-base-content/60 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
