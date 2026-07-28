import React, { useCallback, useEffect, useState } from "react";
import { PinnedActionCard } from "../components/PinnedActionCard";
import { PostCard } from "../components/PostCard";
import { PostComposer } from "../components/PostComposer";
import { CommentsSheet } from "../components/CommentsSheet";
import { BottomSheet } from "../components/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { fetchFeed } from "../lib/api/posts";
import {
  castVote,
  fetchCandidates,
  fetchMyVote,
  fetchVoteResults,
  submitTeacherReport,
} from "../lib/api/civic";
import { supabase } from "../lib/supabase";
import type { PostView } from "../types/models";
import type { PrincipalCandidateRow } from "../types/database";

export const HomeFeedPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"vote" | "report" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<PrincipalCandidateRow[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [voteBusy, setVoteBusy] = useState(false);

  const [teacherName, setTeacherName] = useState("");
  const [reportClass, setReportClass] = useState("");
  const [reportCategory, setReportCategory] = useState("Conduct");
  const [reportText, setReportText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [reportBusy, setReportBusy] = useState(false);

  const flash = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const loadFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await fetchFeed(user.id);
    setLoading(false);
    if (err) setError(err);
    else {
      setError(null);
      setPosts(data);
    }
  }, [user]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => {
        void loadFeed();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadFeed]);

  useEffect(() => {
    if (activeModal !== "vote" || !user) return;
    void (async () => {
      const [c, r, mine] = await Promise.all([
        fetchCandidates(),
        fetchVoteResults(),
        fetchMyVote(user.id),
      ]);
      setCandidates(c.data);
      const counts: Record<string, number> = {};
      for (const row of r.data) counts[row.candidate_id] = Number(row.vote_count);
      setVoteCounts(counts);
      setMyVote(mine.candidateId);
      if (mine.candidateId) setSelectedCandidate(mine.candidateId);
    })();
  }, [activeModal, user]);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCandidate || myVote) return;
    setVoteBusy(true);
    const { error: err } = await castVote(user.id, selectedCandidate);
    setVoteBusy(false);
    if (err) {
      flash(err);
      return;
    }
    setMyVote(selectedCandidate);
    setActiveModal(null);
    flash("Vote submitted. Thank you.");
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !teacherName.trim() || !reportText.trim()) return;
    setReportBusy(true);
    const { error: err } = await submitTeacherReport({
      reporterId: user.id,
      teacherName,
      className: reportClass,
      category: reportCategory,
      description: reportText,
      isAnonymous,
    });
    setReportBusy(false);
    if (err) {
      flash(err);
      return;
    }
    setActiveModal(null);
    setTeacherName("");
    setReportClass("");
    setReportText("");
    flash("Report received. Our ethics board will review within 24h.");
  };

  return (
    <div className="flex flex-col w-full gap-md">
      <div aria-live="polite" className="sr-only">
        {feedbackMessage}
      </div>
      {feedbackMessage && (
        <div className="bg-primary text-on-primary p-md rounded-xl shadow-md text-body-sm text-center fade-toast" role="status">
          {feedbackMessage}
        </div>
      )}

      <section aria-label="Campus actions" className="grid grid-cols-2 gap-sm">
        <PinnedActionCard title="Vote for Principal" iconType="vote" onClick={() => setActiveModal("vote")} />
        <PinnedActionCard title="Report a Teacher" iconType="report" onClick={() => setActiveModal("report")} />
      </section>

      <PostComposer
        onCreated={(post) => {
          setPosts((prev) => [post, ...prev]);
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
        {!loading && !error && posts.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-lg text-center space-y-sm">
            <p className="text-headline-md text-on-surface">No posts yet</p>
            <p className="text-body-md text-on-surface-variant">Be the first to share an update with your campus.</p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onCommentClick={() => setCommentPostId(post.id)}
            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            onLikeChange={(id, liked, likes) =>
              setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked, likes } : p)))
            }
          />
        ))}
      </section>

      {!loading && posts.length > 0 && (
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
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
        onCountChange={(delta) => {
          if (!commentPostId) return;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === commentPostId ? { ...p, comments: Math.max(0, p.comments + delta) } : p
            )
          );
        }}
      />

      <BottomSheet open={activeModal === "vote"} title="Vote for Principal" onClose={() => setActiveModal(null)}>
        <p className="text-body-sm text-on-surface-variant mb-md">
          Select your nominee for the upcoming Academic Principal term. One vote per student.
        </p>
        {myVote && (
          <p className="text-label-md text-secondary mb-md font-semibold">You have already cast your vote.</p>
        )}
        <form onSubmit={handleVoteSubmit} className="space-y-md">
          <fieldset className="space-y-xs border-0 p-0 m-0" disabled={Boolean(myVote)}>
            <legend className="sr-only">Candidates</legend>
            {candidates.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">No candidates available yet.</p>
            ) : (
              candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex items-center gap-sm p-sm min-h-[48px] rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="principal-vote"
                    value={candidate.id}
                    checked={selectedCandidate === candidate.id}
                    onChange={(e) => setSelectedCandidate(e.target.value)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-body-md font-semibold text-on-surface truncate">{candidate.full_name}</span>
                    <span className="block text-label-sm text-on-surface-variant truncate">
                      {candidate.class_name || candidate.bio || ""}
                      {voteCounts[candidate.id] != null ? ` · ${voteCounts[candidate.id]} votes` : ""}
                    </span>
                  </span>
                </label>
              ))
            )}
          </fieldset>
          {!myVote && (
            <button
              type="submit"
              disabled={!selectedCandidate || voteBusy}
              className="w-full min-h-[48px] bg-secondary-container text-on-secondary-container font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {voteBusy ? "Submitting…" : "Submit vote"}
            </button>
          )}
        </form>
      </BottomSheet>

      <BottomSheet open={activeModal === "report"} title="Report a Teacher" onClose={() => setActiveModal(null)}>
        <p className="text-body-sm text-on-surface-variant mb-md">
          Reports are reviewed by school administrators. Use this for serious concerns only.
        </p>
        <form onSubmit={handleReportSubmit} className="space-y-md">
          <div className="space-y-xs">
            <label className="text-label-md text-on-surface" htmlFor="teacher-name">
              Teacher name
            </label>
            <input
              id="teacher-name"
              required
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="text-label-md text-on-surface" htmlFor="report-class">
                Class (optional)
              </label>
              <input
                id="report-class"
                value={reportClass}
                onChange={(e) => setReportClass(e.target.value)}
                className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40"
              />
            </div>
            <div className="space-y-xs">
              <label className="text-label-md text-on-surface" htmlFor="report-category">
                Category
              </label>
              <select
                id="report-category"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40"
              >
                <option>Conduct</option>
                <option>Academic fairness</option>
                <option>Safety</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-xs">
            <label className="text-label-md text-on-surface" htmlFor="report-desc">
              Description
            </label>
            <textarea
              id="report-desc"
              required
              rows={4}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full px-md py-sm rounded-lg bg-surface-container-low border border-outline-variant/40 resize-none"
            />
          </div>
          <label className="flex items-center gap-sm min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span className="text-body-md text-on-surface">Submit anonymously</span>
          </label>
          <button
            type="submit"
            disabled={reportBusy}
            className="w-full min-h-[48px] bg-error text-on-error font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
          >
            {reportBusy ? "Sending…" : "Submit report"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};
