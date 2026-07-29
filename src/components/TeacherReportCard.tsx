import React, { useEffect, useState } from "react";
import type { TeacherReportView } from "../types/models";
import { useAuth } from "../context/AuthContext";
import { toggleReportLike } from "../lib/api/civic";
import { shareText } from "../lib/share";
import {
  FeedCard,
  FeedCardActions,
  FeedCardBody,
  FeedCardHeader,
  feedActionBtnClass,
} from "./FeedCard";

interface TeacherReportCardProps {
  report: TeacherReportView;
  onCommentClick?: () => void;
  onLikeChange?: (reportId: string, liked: boolean, likes: number) => void;
}

export const TeacherReportCard: React.FC<TeacherReportCardProps> = ({
  report,
  onCommentClick,
  onLikeChange,
}) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(Boolean(report.liked));
  const [likeCount, setLikeCount] = useState(report.likes);
  const [commentCount, setCommentCount] = useState(report.comments);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(Boolean(report.liked));
    setLikeCount(report.likes);
    setCommentCount(report.comments);
  }, [report.id, report.liked, report.likes, report.comments]);

  const flashToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLike = async () => {
    if (!user || busy) return;
    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !liked;
    const nextCount = likeCount + (nextLiked ? 1 : -1);
    setLiked(nextLiked);
    setLikeCount(nextCount);
    setBusy(true);
    const { error } = await toggleReportLike(report.id, user.id, prevLiked);
    setBusy(false);
    if (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      flashToast(error);
      return;
    }
    onLikeChange?.(report.id, nextLiked, nextCount);
  };

  const handleShare = async () => {
    const parts = [
      "Teacher Report",
      report.teacherName,
      report.category || undefined,
      report.className ? `Class ${report.className}` : undefined,
      report.description.slice(0, 140),
    ].filter(Boolean);
    const result = await shareText("Usmanian", parts.join(" · "));
    flashToast(result.message);
  };

  const meta = [report.category, report.className ? `Class ${report.className}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <FeedCard>
      <div aria-live="polite" className="sr-only">
        {toastMessage}
      </div>
      {toastMessage && (
        <div className="absolute top-2 right-2 z-10 bg-inverse-surface text-inverse-on-surface px-sm py-xs rounded-lg text-body-sm shadow-lg fade-toast pointer-events-none max-w-[70%]">
          {toastMessage}
        </div>
      )}

      <FeedCardHeader>
        <div className="flex items-center gap-sm min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-label-md font-semibold text-error truncate">Teacher Report</p>
            <p className="text-label-sm text-on-surface-variant truncate">
              {report.reporter.name} · {report.reporter.timestamp}
            </p>
          </div>
        </div>
      </FeedCardHeader>

      <FeedCardBody>
        <p className="text-body-md font-semibold text-on-surface">{report.teacherName}</p>
        {meta ? <p className="text-label-sm text-on-surface-variant mt-xs">{meta}</p> : null}
        <p className="text-body-md text-on-surface whitespace-pre-wrap break-words mt-sm">
          {report.description}
        </p>
      </FeedCardBody>

      <FeedCardActions>
        <button
          type="button"
          aria-pressed={liked}
          aria-label={`${likeCount} likes`}
          onClick={handleLike}
          className={feedActionBtnClass}
        >
          <svg
            className={`w-5 h-5 ${liked ? "text-error fill-current" : ""}`}
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-label-md">{likeCount}</span>
        </button>
        <button
          type="button"
          aria-label={`${commentCount} comments`}
          onClick={() => onCommentClick?.()}
          className={feedActionBtnClass}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-label-md">{commentCount}</span>
        </button>
        <button type="button" aria-label="Share report" onClick={handleShare} className={feedActionBtnClass}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-label-md">Share</span>
        </button>
      </FeedCardActions>
    </FeedCard>
  );
};
