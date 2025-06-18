import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Image, X } from 'lucide-react';
import { useEventStore } from '../store/useEventStore';
import { useLocationStore } from '../store/useLocationStore';
import toast from 'react-hot-toast';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { createEvent, isCreating } = useEventStore();
  const { currentLocation, isLocationSet } = useLocationStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    category: 'social',
    maxAttendees: '',
    isPrivate: false,
    venue: '',
    tags: [],
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [currentTag, setCurrentTag] = useState('');

  const categories = [
    { value: 'social', label: 'Social' },
    { value: 'professional', label: 'Professional' },
    { value: 'educational', label: 'Educational' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' },
    { value: 'other', label: 'Other' }
  ];

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

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLocationSet()) {
      toast.error('Please set your location in settings first');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Event description is required');
      return;
    }

    if (!formData.date) {
      toast.error('Event date is required');
      return;
    }

    // Check if date is in the future
    const eventDate = new Date(formData.date);
    if (eventDate <= new Date()) {
      toast.error('Event date must be in the future');
      return;
    }

    try {
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      const createdEvent = await createEvent(eventData);
      navigate(`/events/${createdEvent._id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
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
              Please set your location in settings before creating an event.
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
          <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Event Title *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Give your event a catchy title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description *</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Describe your event"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                maxLength={1000}
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Start Date & Time *</span>
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">End Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Category and Privacy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Category</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Max Attendees</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  placeholder="Leave empty for unlimited"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: e.target.value }))}
                />
              </div>
            </div>

            {/* Venue */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Venue</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Specific venue or address"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              />
              <label className="label">
                <span className="label-text-alt">
                  Event will be located in: {currentLocation?.city}, {currentLocation?.state}
                </span>
              </label>
            </div>

            {/* Tags */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Tags</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  placeholder="Add a tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button type="button" className="btn btn-outline" onClick={addTag}>
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="badge badge-primary gap-2">
                      #{tag}
                      <button
                        type="button"
                        className="btn btn-xs btn-circle btn-ghost"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Event Image</span>
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
                  <p className="text-base-content/60 mb-2">Upload an event image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input file-input-bordered file-input-sm"
                  />
                </div>
              )}
            </div>

            {/* Privacy */}
            <div className="form-control">
              <label className="cursor-pointer flex items-center gap-3">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                />
                <span className="label-text">Make this event private (invite only)</span>
              </label>
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
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;