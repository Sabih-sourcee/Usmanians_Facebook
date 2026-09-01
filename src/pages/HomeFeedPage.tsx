import React, { useCallback, useEffect, useState } from "react";
import { PostCard } from "../components/PostCard";
import { TeacherReportCard } from "../components/TeacherReportCard";
import { PostComposer } from "../components/PostComposer";
import { CommentsSheet } from "../components/CommentsSheet";
import type { CommentsTargetKind } from "../components/CommentsSheet";
import { useAuth } from "../context/AuthContext";
import { fetchFeed } from "../lib/api/posts";
import { supabase } from "../lib/supabase";
import type { FeedItem } from "../types/models";

export const HomeFeedPage: React.FC = () => {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<{
    id: string;
    kind: CommentsTargetKind;
  } | null>(null);

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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "teacher_reports" }, () => {
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
        {feed.map((item) =>
          item.kind === "post" ? (
            <PostCard
              key={`post-${item.post.id}`}
              post={item.post}
              onCommentClick={() => setCommentTarget({ id: item.post.id, kind: "post" })}
              onDeleted={(id) =>
                setFeed((prev) => prev.filter((f) => !(f.kind === "post" && f.post.id === id)))
              }
              onLikeChange={(id, liked, likes) =>
                setFeed((prev) =>
                  prev.map((f) =>
                    f.kind === "post" && f.post.id === id
                      ? { ...f, post: { ...f.post, liked, likes } }
                      : f
                  )
                )
              }
            />
          ) : (
            <TeacherReportCard
              key={`report-${item.report.id}`}
              report={item.report}
              onCommentClick={() => setCommentTarget({ id: item.report.id, kind: "teacher-report" })}
              onLikeChange={(id, liked, likes) =>
                setFeed((prev) =>
                  prev.map((f) =>
                    f.kind === "teacher-report" && f.report.id === id
                      ? { ...f, report: { ...f.report, liked, likes } }
                      : f
                  )
                )
              }
            />
          )
        )}
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
        targetId={commentTarget?.id ?? null}
        targetKind={commentTarget?.kind}
        onClose={() => setCommentTarget(null)}
        onCountChange={(delta) => {
          if (!commentTarget) return;
          setFeed((prev) =>
            prev.map((f) => {
              if (commentTarget.kind === "post" && f.kind === "post" && f.post.id === commentTarget.id) {
                return {
                  ...f,
                  post: { ...f.post, comments: Math.max(0, f.post.comments + delta) },
                };
              }
              if (
                commentTarget.kind === "teacher-report" &&
                f.kind === "teacher-report" &&
                f.report.id === commentTarget.id
              ) {
                return {
                  ...f,
                  report: { ...f.report, comments: Math.max(0, f.report.comments + delta) },
                };
              }
              return f;
            })
          );
        }}
      />
    </div>
  );
};
