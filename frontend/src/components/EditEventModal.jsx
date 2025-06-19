import { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const EditEventModal = ({ isOpen, onClose, event, onUpdate }) => {
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
  const [isUpdating, setIsUpdating] = useState(false);

  const categories = [
    { value: 'social', label: 'Social' },
    { value: 'professional', label: 'Professional' },
    { value: 'educational', label: 'Educational' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        category: event.category || 'social',
        maxAttendees: event.maxAttendees || '',
        isPrivate: event.isPrivate || false,
        venue: event.location?.venue || '',
        tags: event.tags || [],
        image: null
      });
      setImagePreview(event.image || null);
    }
  }, [event, isOpen]);

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

    setIsUpdating(true);
    try {
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      await onUpdate(eventData);
      onClose();
    } catch (error) {
      console.error('Failed to update event:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        category: event.category || 'social',
        maxAttendees: event.maxAttendees || '',
        isPrivate: event.isPrivate || false,
        venue: event.location?.venue || '',
        tags: event.tags || [],
        image: null
      });
      setImagePreview(event.image || null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Edit Event</h3>
          <button 
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="textarea textarea-bordered h-20"
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

          {/* Category and Max Attendees */}
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
                  className="w-full h-32 object-cover rounded-lg"
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
              <div className="border-2 border-dashed border-base-300 rounded-lg p-4 text-center">
                <Image className="w-8 h-8 mx-auto text-base-content/40 mb-2" />
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
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={handleReset}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;