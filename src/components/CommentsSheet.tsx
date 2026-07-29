import React, { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { useAuth } from "../context/AuthContext";
import { addComment, fetchComments } from "../lib/api/posts";
import { addReportComment, fetchReportComments } from "../lib/api/civic";
import type { CommentView } from "../types/models";

export type CommentsTargetKind = "post" | "teacher-report";

interface CommentsSheetProps {
  targetId: string | null;
  targetKind?: CommentsTargetKind;
  onClose: () => void;
  onCountChange?: (delta: number) => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  targetId,
  targetKind = "post",
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
    const load =
      targetKind === "teacher-report"
        ? fetchReportComments(targetId)
        : fetchComments(targetId);
    load.then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) setError(err);
      else setComments(data);
    });
    return () => {
      cancelled = true;
    };
  }, [targetId, targetKind]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !user || !text.trim()) return;
    setSubmitting(true);
    const result =
      targetKind === "teacher-report"
        ? await addReportComment({
            reportId: targetId,
            authorId: user.id,
            content: text,
          })
        : await addComment({
            postId: targetId,
            authorId: user.id,
            content: text,
          });
    setSubmitting(false);
    if (result.error || !result.data) {
      setError(result.error || "Could not comment");
      return;
    }
    setComments((prev) => [...prev, result.data!]);
    setText("");
    onCountChange?.(1);
  };

  return (
    <BottomSheet open={Boolean(targetId)} title="Comments" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-lg">
          <span className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-lg">No comments yet. Be the first.</p>
      ) : (
        <ul className="flex flex-col gap-md list-none p-0 m-0 mb-md">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-sm items-start">
              <img src={c.authorAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" width={36} height={36} />
              <div className="min-w-0 flex-1 bg-surface-container-low rounded-lg px-sm py-sm">
                <div className="flex items-baseline justify-between gap-sm">
                  <span className="text-label-md font-semibold text-on-surface truncate">{c.authorName}</span>
                  <time className="text-label-sm text-on-surface-variant shrink-0">{c.timestamp}</time>
                </div>
                <p className="text-body-md text-on-surface mt-xs break-words">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-label-md text-error mb-sm" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="flex gap-sm items-end sticky bottom-0 bg-surface-container-lowest pt-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 min-h-[44px] px-sm rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-md"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="min-h-[44px] px-md bg-primary text-on-primary font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
        >
          Send
        </button>
      </form>
    </BottomSheet>
  );
};
