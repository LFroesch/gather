export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDistance(distanceInMiles) {
  if (distanceInMiles < 0.1) return "< 0.1 mi";
  if (distanceInMiles < 1) return `${Math.round(distanceInMiles * 10) / 10} mi`;
  if (distanceInMiles < 10) return `${Math.round(distanceInMiles * 10) / 10} mi`;
  return `${Math.round(distanceInMiles)} mi`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}