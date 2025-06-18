import { useState } from 'react';
import { Copy, Check, X, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ShareModal = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [copied, setCopied] = useState(false);
  
  const eventUrl = `${window.location.origin}/events/${eventId}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(error.message || 'Failed to copy link');
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Check out this event: ${eventTitle}`,
          url: eventUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Share Event</h3>
          <button 
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Event Link</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1"
                value={eventUrl}
                readOnly
              />
              <button
                className="btn btn-outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {navigator.share && (
              <button
                className="btn btn-primary flex-1"
                onClick={handleShareNative}
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
            <button
              className="btn btn-outline flex-1"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;