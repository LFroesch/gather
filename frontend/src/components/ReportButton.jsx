import { useState } from 'react';
import { Flag } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const ReportButton = ({ contentType, contentId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/reports', { contentType, contentId, reason, details });
      toast.success('Report submitted');
      setIsOpen(false);
      setDetails('');
      setReason('spam');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        className={`btn btn-ghost btn-xs text-base-content/50 hover:text-error hover:opacity-100 opacity-80 ${className}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        title="Report"
      >
        <Flag className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="modal modal-open z-50" onClick={() => setIsOpen(false)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Report Content</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Reason</span></label>
                <select className="select select-bordered w-full" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Details (optional)</span></label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  maxLength={500}
                  placeholder="Additional details..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              <div className="modal-action mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-error" disabled={isSubmitting}>
                  {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;
