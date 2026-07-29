import React, { useEffect, useRef, useState } from "react";
import type { PostView } from "../types/models";
import { useAuth } from "../context/AuthContext";
import { deletePost, toggleLike } from "../lib/api/posts";
import { shareText } from "../lib/share";
import {
  FeedCard,
  FeedCardActions,
  FeedCardBody,
  FeedCardHeader,
  feedActionBtnClass,
} from "./FeedCard";

interface PostCardProps {
  post: PostView;
  onCommentClick?: () => void;
  onDeleted?: (postId: string) => void;
  onLikeChange?: (postId: string, liked: boolean, likes: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onCommentClick,
  onDeleted,
  onLikeChange,
}) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showOptions, setShowOptions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiked(Boolean(post.liked));
    setLikeCount(post.likes);
    setCommentCount(post.comments);
  }, [post.id, post.liked, post.likes, post.comments]);

  useEffect(() => {
    if (!showOptions) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showOptions]);

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
    const { error } = await toggleLike(post.id, user.id, prevLiked);
    setBusy(false);
    if (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      flashToast(error);
      return;
    }
    onLikeChange?.(post.id, nextLiked, nextCount);
  };

  const handleShare = async () => {
    const result = await shareText("Usmanian", post.content.slice(0, 140));
    flashToast(result.message);
  };

  const handleDelete = async () => {
    setShowOptions(false);
    const { error } = await deletePost(post.id);
    if (error) {
      flashToast(error);
      return;
    }
    onDeleted?.(post.id);
  };

  const hasAttachment = Boolean(post.attachment?.fileName && !post.attachment?.imageUrl);
  const imageSrc = post.attachment?.imageUrl || post.imageUrl || null;
  const isOwner = user?.id === post.authorId;

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
        {post.categoryHeader ? (
          <div className="flex items-center gap-sm min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-label-md font-semibold text-secondary truncate">{post.categoryHeader}</p>
              <p className="text-label-sm text-on-surface-variant truncate">
                {post.author.name} · {post.author.timestamp}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-sm min-w-0 flex-1">
            <img
              src={post.author.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
              width={40}
              height={40}
            />
            <div className="min-w-0">
              <p className="text-body-md font-semibold text-on-surface truncate">{post.author.name}</p>
              <p className="text-label-sm text-on-surface-variant">{post.author.timestamp}</p>
            </div>
          </div>
        )}

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="Post options"
            aria-expanded={showOptions}
            onClick={() => setShowOptions((v) => !v)}
            className="w-11 h-11 flex items-center justify-center text-on-surface-variant rounded-full hover:bg-surface-container cursor-pointer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showOptions && (
            <div className="absolute right-0 top-11 z-20 w-40 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-xs">
              <button
                type="button"
                onClick={handleShare}
                className="w-full text-left px-md py-sm min-h-[44px] text-body-sm hover:bg-surface-container cursor-pointer"
              >
                Share
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full text-left px-md py-sm min-h-[44px] text-body-sm text-error hover:bg-surface-container cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </FeedCardHeader>

      <FeedCardBody>
        <p className="text-body-md text-on-surface whitespace-pre-wrap break-words">{post.content}</p>
      </FeedCardBody>

      {imageSrc && (
        <div className="w-full max-h-[420px] bg-surface-container overflow-hidden">
          <img src={imageSrc} alt="" className="w-full h-auto max-h-[420px] object-cover" />
        </div>
      )}

      {hasAttachment && post.attachment && (
        <div className="mx-md mb-sm p-md rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-center gap-md min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-semibold text-on-surface truncate">{post.attachment.fileName}</p>
            {post.attachment.categories?.length ? (
              <p className="text-label-sm text-on-surface-variant truncate">
                {post.attachment.categories.join(" · ")}
              </p>
            ) : null}
          </div>
          {post.attachment.downloadUrl && (
            <a
              href={post.attachment.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] px-md inline-flex items-center text-label-md text-primary font-semibold"
            >
              Open
            </a>
          )}
        </div>
      )}

      <FeedCardActions>
        <button type="button" aria-pressed={liked} aria-label={`${likeCount} likes`} onClick={handleLike} className={feedActionBtnClass}>
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
        <button type="button" aria-label="Share post" onClick={handleShare} className={feedActionBtnClass}>
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
