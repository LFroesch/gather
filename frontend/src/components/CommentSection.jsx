import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Send, X } from 'lucide-react';
import ReportButton from './ReportButton';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const CommentSection = ({ parentType, parentId, parentOwnerId }) => {
  const { authUser } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { rootId, username }
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [parentType, parentId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/comments/${parentType}/${parentId}`);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post(`/comments/${parentType}/${parentId}`, {
        text: newComment
      });
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post(`/comments/${parentType}/${parentId}`, {
        text: replyText,
        replyTo: replyingTo.rootId
      });
      setComments(prev => [...prev, res.data]);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await axiosInstance.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleLike = async (commentId) => {
    try {
      const res = await axiosInstance.post(`/comments/${commentId}/like`);
      setComments(prev => prev.map(c =>
        c._id === commentId ? { ...c, likes: res.data.likes } : c
      ));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  const canDelete = (comment) => {
    return comment.author?._id === authUser._id || parentOwnerId === authUser._id;
  };

  // Group into top-level and replies — filter out comments with deleted authors
  const validComments = comments.filter(c => c.author);
  const topLevel = validComments.filter(c => !c.replyTo);
  const repliesMap = {};
  validComments.filter(c => c.replyTo).forEach(c => {
    const key = c.replyTo.toString();
    if (!repliesMap[key]) repliesMap[key] = [];
    repliesMap[key].push(c);
  });

  const renderComment = (comment, isReply = false) => {
    const isLiked = comment.likes?.includes(authUser._id);
    return (
      <div key={comment._id} className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
        <Link to={`/profile/${comment.author.username}`}>
          <div className="avatar">
            <div className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full`}>
              <img src={comment.author.profilePic || '/avatar.png'} alt={comment.author.fullName} />
            </div>
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-base-200 rounded-lg px-3 py-2">
            <Link
              to={`/profile/${comment.author.username}`}
              className="font-medium text-sm hover:text-primary"
            >
              {comment.author.fullName}
              <span className="text-xs text-base-content/50 font-normal ml-1">@{comment.author.username}</span>
            </Link>
            <p className="text-sm break-words">{comment.text}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-base-content/50">{formatTime(comment.createdAt)}</span>
            <button
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked ? 'text-red-500' : 'text-base-content/50 hover:text-red-500'
              }`}
              onClick={() => handleLike(comment._id)}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likes?.length > 0 && comment.likes.length}
            </button>
            {!isReply && (
              <button
                className="text-xs text-base-content/50 hover:text-primary transition-colors"
                onClick={() => {
                  setReplyingTo({ rootId: comment._id, username: comment.author.username });
                  setReplyText('');
                }}
              >
                Reply
              </button>
            )}
            {canDelete(comment) && (
              <button
                className="text-xs text-base-content/50 hover:text-error transition-colors"
                onClick={() => handleDelete(comment._id)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <ReportButton contentType="comment" contentId={comment._id} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg border-2 border-base-300 p-6 mt-6" id="comments">
      <h3 className="text-lg font-bold mb-4">Comments ({comments.length})</h3>

      {/* Top-level comment input */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <div className="avatar">
          <div className="w-10 h-10 rounded-full">
            <img src={authUser.profilePic || '/avatar.png'} alt="You" />
          </div>
        </div>
        <div className="flex-1 flex gap-2">
          <textarea
            className="textarea textarea-bordered flex-1 resize-none"
            placeholder="Write a comment..."
            rows={1}
            maxLength={500}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm self-end"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-base-content/60 py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <div key={comment._id} className="space-y-3">
              {renderComment(comment, false)}

              {/* Replies */}
              {repliesMap[comment._id]?.map(reply => renderComment(reply, true))}

              {/* Reply input */}
              {replyingTo?.rootId === comment._id && (
                <form onSubmit={handleReplySubmit} className="flex gap-2 ml-10">
                  <div className="avatar">
                    <div className="w-7 h-7 rounded-full">
                      <img src={authUser.profilePic || '/avatar.png'} alt="You" />
                    </div>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <textarea
                      className="textarea textarea-bordered textarea-sm flex-1 resize-none text-sm"
                      placeholder={`Reply to ${replyingTo.username}...`}
                      rows={1}
                      maxLength={500}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit(e);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        type="submit"
                        className="btn btn-primary btn-xs"
                        disabled={!replyText.trim() || isSubmitting}
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
