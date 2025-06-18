import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Image, X, Calendar } from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useEventStore } from '../store/useEventStore';
import { useLocationStore } from '../store/useLocationStore';
import toast from 'react-hot-toast';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { createPost, isCreating } = usePostStore();
  const { myEvents, getMyEvents } = useEventStore();
  const { currentLocation, isLocationSet } = useLocationStore();

  const [formData, setFormData] = useState({
    content: '',
    image: null,
    type: 'general',
    eventId: ''
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    // Load user's events for potential linking
    getMyEvents();
  }, [getMyEvents]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLocationSet()) {
      toast.error('Please set your location in settings first');
      return;
    }

    if (!formData.content.trim() && !formData.image) {
      toast.error('Please add some content or an image');
      return;
    }

    try {
      const postData = {
        content: formData.content.trim(),
        image: formData.image,
        type: formData.eventId ? 'event-related' : 'general',
        eventId: formData.eventId || undefined
      };

      await createPost(postData);
      navigate('/');
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  if (!isLocationSet()) {
    return (
      <div className="min-h-screen bg-base-200 pt-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-base-100 rounded-xl shadow-lg p-6 text-center">
            <MapPin className="w-12 h-12 mx-auto text-warning mb-4" />
            <h2 className="text-xl font-bold mb-2">Location Required</h2>
            <p className="text-base-content/60 mb-4">
              Please set your location in settings before creating a post.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/settings')}
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pt-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">What's on your mind?</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="Share your thoughts..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                maxLength={500}
              />
              <label className="label">
                <span className="label-text-alt">
                  {formData.content.length}/500 characters
                </span>
              </label>
            </div>

            {/* Image Upload */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Image (optional)</span>
              </label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center">
                  <Image className="w-12 h-12 mx-auto text-base-content/40 mb-2" />
                  <p className="text-base-content/60 mb-2">Add an image to your post</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input file-input-bordered file-input-sm"
                  />
                </div>
              )}
            </div>

            {/* Link to Event */}
            {myEvents && myEvents.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Link to Event (optional)</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.eventId}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventId: e.target.value }))}
                >
                  <option value="">No event selected</option>
                  {myEvents.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.title} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <label className="label">
                  <span className="label-text-alt">
                    Link this post to one of your upcoming events
                  </span>
                </label>
              </div>
            )}

            {/* Location Display */}
            <div className="alert alert-info">
              <MapPin className="w-4 h-4" />
              <span>
                This post will be shared from: {currentLocation?.city}, {currentLocation?.state}
              </span>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                className="btn btn-outline flex-1"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isCreating || (!formData.content.trim() && !formData.image)}
              >
                {isCreating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;