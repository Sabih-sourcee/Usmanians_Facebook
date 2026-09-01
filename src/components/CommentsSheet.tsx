import React, { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { useAuth } from "../context/AuthContext";
import { addComment, fetchComments } from "../lib/api/posts";
import type { CommentView } from "../types/models";

interface CommentsSheetProps {
  targetId: string | null;
  onClose: () => void;
  onCountChange?: (delta: number) => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  targetId,
  onClose,
  onCountChange,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentView[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setText("");
    fetchComments(targetId).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) setError(err);
      else setComments(data);
    });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !targetId || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    const { data, error: err } = await addComment({
      postId: targetId,
      authorId: user.id,
      content: text.trim(),
    });
    setSubmitting(false);
    if (err || !data) {
      setError(err || "Could not post comment");
      return;
    }
    setComments((prev) => [...prev, data]);
    setText("");
    onCountChange?.(1);
  };

  return (
    <BottomSheet open={Boolean(targetId)} title="Comments" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-lg">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ul className="space-y-md list-none p-0 m-0">
          {comments.length === 0 && (
            <p className="text-body-md text-on-surface-variant text-center py-md">No comments yet.</p>
          )}
          {comments.map((c) => (
            <li key={c.id} className="flex gap-sm">
              <img src={c.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className="min-w-0">
                <p className="text-label-md font-semibold text-on-surface">{c.authorName}</p>
                <p className="text-body-sm text-on-surface">{c.content}</p>
                <p className="text-label-sm text-on-surface-variant">{c.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-body-sm text-error mt-sm" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-md flex gap-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 h-11 px-md rounded-lg bg-surface-container-low border border-outline-variant/40"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="min-h-[44px] px-md rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-50 cursor-pointer"
        >
          Post
        </button>
      </form>
    </BottomSheet>
  );
};
