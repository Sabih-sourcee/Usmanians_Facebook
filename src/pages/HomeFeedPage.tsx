import React, { useCallback, useEffect, useState } from "react";
import { PostCard } from "../components/PostCard";
import { PostComposer } from "../components/PostComposer";
import { CommentsSheet } from "../components/CommentsSheet";
import { useAuth } from "../context/AuthContext";
import { fetchFeed } from "../lib/api/posts";
import { supabase } from "../lib/supabase";
import type { FeedItem } from "../types/models";

export const HomeFeedPage: React.FC = () => {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await fetchFeed(user.id);
    setLoading(false);
    if (err && data.length === 0) setError(err);
    else {
      setError(null);
      setFeed(data);
    }
  }, [user]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("home-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => {
        void loadFeed();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadFeed]);

  return (
    <div className="flex flex-col w-full gap-md">
      <PostComposer
        onCreated={(post) => {
          if (post.type === "notes") return;
          setFeed((prev) => [
            { kind: "post", createdAt: post.createdAt || new Date().toISOString(), post },
            ...prev,
          ]);
        }}
      />

      <section aria-label="Home feed" className="flex flex-col gap-md">
        {loading && (
          <div className="flex justify-center py-xl">
            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading feed" />
          </div>
        )}
        {!loading && error && (
          <p className="text-body-md text-error text-center py-lg" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && feed.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-lg text-center space-y-sm">
            <p className="text-headline-md text-on-surface">No posts yet</p>
            <p className="text-body-md text-on-surface-variant">Be the first to share an update with your campus.</p>
          </div>
        )}
        {feed.map((item) => (
          <PostCard
            key={`post-${item.post.id}`}
            post={item.post}
            onCommentClick={() => setCommentPostId(item.post.id)}
            onDeleted={(id) => setFeed((prev) => prev.filter((f) => f.post.id !== id))}
            onLikeChange={(id, liked, likes) =>
              setFeed((prev) =>
                prev.map((f) => (f.post.id === id ? { ...f, post: { ...f.post, liked, likes } } : f))
              )
            }
          />
        ))}
      </section>

      {!loading && feed.length > 0 && (
        <div className="py-xl flex flex-col items-center gap-sm text-on-surface-variant">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-label-md">You&apos;re all caught up for today</span>
        </div>
      )}

      <CommentsSheet
        targetId={commentPostId}
        onClose={() => setCommentPostId(null)}
        onCountChange={(delta) => {
          if (!commentPostId) return;
          setFeed((prev) =>
            prev.map((f) =>
              f.post.id === commentPostId
                ? { ...f, post: { ...f.post, comments: Math.max(0, f.post.comments + delta) } }
                : f
            )
          );
        }}
      />
    </div>
  );
};
