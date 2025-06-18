import { useState } from 'react';
import { X, Save, User, AtSign, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const EditProfileModal = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    username: currentUser?.username || '',
    bio: currentUser?.bio || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (formData.username.length < 3 || formData.username.length > 20) {
      toast.error('Username must be between 3 and 20 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }
    
    if (formData.bio.length > 160) {
      toast.error('Bio must be 160 characters or less');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: currentUser?.fullName || '',
      username: currentUser?.username || '',
      bio: currentUser?.bio || ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Edit Profile</h3>
          <button 
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Full Name</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-base-content/40" />
              </div>
              <input
                type="text"
                className="input input-bordered w-full pl-10"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Username</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSign className="w-4 h-4 text-base-content/40" />
              </div>
              <input
                type="text"
                className="input input-bordered w-full pl-10"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') 
                }))}
                maxLength={20}
                required
              />
            </div>
            <label className="label">
              <span className="label-text-alt">
                {formData.username.length}/20 characters
              </span>
            </label>
          </div>

          {/* Bio */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Bio</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="w-4 h-4 text-base-content/40" />
              </div>
              <textarea
                className="textarea textarea-bordered w-full pl-10 pt-3"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                maxLength={160}
                rows={3}
              />
            </div>
            <label className="label">
              <span className="label-text-alt">
                {formData.bio.length}/160 characters
              </span>
            </label>
          </div>

          {/* Action Buttons */}
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

export default EditProfileModal;