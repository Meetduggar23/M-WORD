import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './CommentsPanel.css';

export const CommentsPanel: React.FC = () => {
  const engine = useDocumentEngine();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const comments = engine.comments.filter(c => showResolved || !c.resolved);

  const handleAddComment = () => {
    if (newComment.trim()) {
      engine.addComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleReply = (commentId: string) => {
    if (replyText.trim()) {
      engine.replyToComment(commentId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    }
  };

  return (
    <div className="comments-panel">
      <div className="cp-header">
        <span className="cp-title">Comments</span>
        <label className="cp-toggle">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          <span>Show Resolved</span>
        </label>
      </div>

      <div className="cp-new-comment">
        <textarea
          className="cp-textarea"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
        />
        <button className="cp-btn" onClick={handleAddComment} disabled={!newComment.trim()}>
          Comment
        </button>
      </div>

      <div className="cp-list">
        {comments.length === 0 && (
          <div className="cp-empty">No comments yet</div>
        )}
        {comments.map(comment => (
          <div key={comment.id} className={`cp-comment ${comment.resolved ? 'resolved' : ''}`}>
            <div className="cp-comment-header">
              <div className="cp-avatar" title={comment.author}>
                {comment.authorInitials}
              </div>
              <div className="cp-comment-meta">
                <span className="cp-author">{comment.author}</span>
                <span className="cp-date">
                  {new Date(comment.date).toLocaleDateString()} {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="cp-comment-actions">
                <button
                  className="cp-action-btn"
                  onClick={() => engine.resolveComment(comment.id)}
                  title={comment.resolved ? 'Reopen' : 'Resolve'}
                >
                  {comment.resolved ? '🔄' : '✅'}
                </button>
                <button
                  className="cp-action-btn delete"
                  onClick={() => engine.deleteComment(comment.id)}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
            <div className="cp-comment-body">{comment.text}</div>

            {/* Replies */}
            {comment.replies.map(reply => (
              <div key={reply.id} className="cp-reply">
                <div className="cp-reply-header">
                  <div className="cp-avatar small" title={reply.author}>
                    {reply.authorInitials}
                  </div>
                  <span className="cp-author">{reply.author}</span>
                  <span className="cp-date">
                    {new Date(reply.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="cp-reply-body">{reply.text}</div>
              </div>
            ))}

            {/* Reply input */}
            {replyingTo === comment.id ? (
              <div className="cp-reply-input">
                <textarea
                  className="cp-textarea small"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply..."
                  rows={1}
                  autoFocus
                />
                <div className="cp-reply-actions">
                  <button className="cp-btn small" onClick={() => handleReply(comment.id)}>Reply</button>
                  <button className="cp-btn small cancel" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="cp-reply-btn" onClick={() => setReplyingTo(comment.id)}>
                Reply
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
