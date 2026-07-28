import React, { useEffect, useRef, useState } from "react";
import { Post } from "../data/mockPosts";

interface PostCardProps {
  post: Post;
  onCommentClick?: () => void;
  onShareClick?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onCommentClick,
  onShareClick,
}) => {
  const [liked, setLiked] = useState<boolean>(post.liked || false);
  const [likeCount, setLikeCount] = useState<number>(post.likes);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const flashToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAction = (actionName: string) => {
    if (actionName === "Save") {
      setIsSaved(!isSaved);
      flashToast(!isSaved ? "Saved to your bookmarks" : "Removed from bookmarks");
    } else if (actionName === "Share") {
      flashToast("Link copied to clipboard");
      onShareClick?.();
    } else if (actionName === "Comment") {
      if (onCommentClick) onCommentClick();
      else flashToast("Comments coming soon");
    }
  };

  const hasAttachment = Boolean(post.attachment?.fileName);
  const hasImage = Boolean(post.attachment?.imageUrl);
  const actionBtn =
    "min-h-[44px] min-w-[44px] px-sm flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-lg cursor-pointer";

  return (
    <article className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex flex-col relative">
      <div aria-live="polite" className="sr-only">
        {toastMessage}
      </div>
      {toastMessage && (
        <div className="absolute top-2 right-2 z-10 bg-inverse-surface text-inverse-on-surface px-sm py-xs rounded-lg text-body-sm shadow-lg fade-toast pointer-events-none">
          {toastMessage}
        </div>
      )}

      <div className="p-md flex items-center gap-md">
        {post.categoryHeader ? (
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-md text-on-surface font-semibold truncate">{post.categoryHeader}</span>
              <span className="text-label-sm text-on-surface-variant">{post.author.timestamp}</span>
            </div>
          </div>
        ) : (
          <>
            <img
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
              width={40}
              height={40}
              src={post.author.avatar}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-body-md font-semibold text-on-surface truncate">{post.author.name}</span>
              <span className="text-label-sm text-on-surface-variant">{post.author.timestamp}</span>
            </div>
          </>
        )}

        <div className="ml-auto relative" ref={menuRef}>
          <button
            type="button"
            aria-label="More options"
            aria-expanded={showOptions}
            onClick={() => setShowOptions(!showOptions)}
            className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-full transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showOptions && (
            <div className="absolute right-0 top-12 w-44 bg-surface-container-lowest shadow-lg rounded-xl border border-outline-variant/30 py-xs z-20">
              <button
                type="button"
                onClick={() => {
                  setShowOptions(false);
                  handleAction("Save");
                }}
                className="w-full text-left px-md py-sm min-h-[44px] text-body-sm text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                {isSaved ? "Unsave Post" : "Save Post"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptions(false);
                  flashToast("Report submitted to moderation");
                }}
                className="w-full text-left px-md py-sm min-h-[44px] text-body-sm text-error hover:bg-error-container/30 transition-colors cursor-pointer"
              >
                Report Post
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`px-md ${hasAttachment || hasImage ? "pb-sm" : "pb-md"}`}>
        <p className="text-body-md text-on-surface leading-relaxed mb-sm">{post.content}</p>

        {hasImage && (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-surface-container my-md">
            <img
              className="w-full h-full object-cover"
              src={post.attachment?.imageUrl}
              alt="Post attachment"
              loading="lazy"
            />
          </div>
        )}

        {hasAttachment && !hasImage && (
          <div className="bg-surface-container rounded-xl p-md flex flex-col gap-sm my-xs">
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 rounded-lg bg-error-container flex items-center justify-center text-error shrink-0">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-body-md font-semibold text-on-surface truncate">{post.attachment?.fileName}</span>
                <span className="text-label-sm text-on-surface-variant">{post.attachment?.fileSize}</span>
              </div>
            </div>
            {post.attachment?.categories && post.attachment.categories.length > 0 && (
              <div className="flex flex-wrap gap-xs pt-xs">
                {post.attachment.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-sm py-1 rounded-full bg-surface-container-high text-on-surface text-label-sm uppercase tracking-wider font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mt-md flex gap-xs flex-wrap">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="px-sm py-xs bg-surface-container text-on-surface-variant rounded-full text-label-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-sm py-xs flex items-center justify-between border-t border-surface-container-highest">
        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? `Unlike, ${likeCount} likes` : `Like, ${likeCount} likes`}
            className={actionBtn}
          >
            <svg
              className={`w-5 h-5 ${liked ? "fill-error text-error" : "fill-none stroke-current"}`}
              fill="none"
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

          <button type="button" aria-label={`${post.comments} comments`} onClick={() => handleAction("Comment")} className={actionBtn}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-label-md">{post.comments}</span>
          </button>
        </div>

        <button
          type="button"
          aria-label={hasAttachment ? (isSaved ? "Unsave" : "Save") : "Share"}
          onClick={() => handleAction(hasAttachment ? "Save" : "Share")}
          className={actionBtn}
        >
          {hasAttachment ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-label-md">{isSaved ? "Saved" : "Save"}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-label-md">Share</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
