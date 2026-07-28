import React, { useEffect, useId, useRef, useState } from "react";
import { PinnedActionCard } from "../components/PinnedActionCard";
import { PostCard } from "../components/PostCard";
import { feedPosts } from "../data/mockPosts";

export const HomeFeedPage: React.FC = () => {
  const [activeModal, setActiveModal] = useState<"vote" | "report" | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [reportText, setReportText] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!activeModal) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeModal]);

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setFeedbackMessage(`Vote submitted for ${selectedCandidate}`);
    setActiveModal(null);
    setSelectedCandidate("");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage("Report received. Our ethics board will review within 24h.");
    setActiveModal(null);
    setReportText("");
    setTimeout(() => setFeedbackMessage(null), 3000);
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

      <section aria-label="Home feed" className="flex flex-col gap-md">
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      <div className="py-xl flex flex-col items-center gap-sm text-on-surface-variant">
        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
          <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-label-md">You're all caught up for today</span>
      </div>

      {activeModal === "vote" && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-md bg-black/50"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-surface-container-lowest w-full max-w-sm rounded-xl p-lg shadow-xl space-y-md border border-outline-variant/20"
          >
            <div className="flex justify-between items-center gap-sm">
              <h3 id={titleId} className="text-headline-md text-on-surface">
                Vote for Principal
              </h3>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label="Close"
                onClick={() => setActiveModal(null)}
                className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Select your nominee for the upcoming 2026-2027 Academic Principal term.
            </p>
            <form onSubmit={handleVoteSubmit} className="space-y-md">
              <fieldset className="space-y-xs border-0 p-0 m-0">
                <legend className="sr-only">Candidates</legend>
                {["Dr. Arshad Mahmood (Campus 12)", "Prof. Naila Farooq (Main Campus)", "Dr. Tariq Hassan (West Wing)"].map(
                  (candidate) => (
                    <label
                      key={candidate}
                      className="flex items-center gap-sm p-sm min-h-[48px] rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="principal-vote"
                        value={candidate}
                        checked={selectedCandidate === candidate}
                        onChange={(e) => setSelectedCandidate(e.target.value)}
                        className="accent-primary w-4 h-4"
                        required
                      />
                      <span className="text-body-sm text-on-surface font-medium">{candidate}</span>
                    </label>
                  )
                )}
              </fieldset>
              <div className="flex gap-sm pt-xs">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 min-h-[48px] bg-surface-container-high text-on-surface text-label-md rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] bg-primary text-on-primary text-label-md rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Submit vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "report" && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-md bg-black/50"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-report`}
            className="bg-surface-container-lowest w-full max-w-sm rounded-xl p-lg shadow-xl space-y-md border border-outline-variant/20"
          >
            <div className="flex justify-between items-center gap-sm">
              <h3 id={`${titleId}-report`} className="text-headline-md text-error">
                Report a Teacher
              </h3>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label="Close"
                onClick={() => setActiveModal(null)}
                className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Submit confidential feedback directly to the administration review committee.
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-md">
              <div className="space-y-xs">
                <label className="text-label-md text-on-surface block" htmlFor="report-details">
                  Details / Incident Note
                </label>
                <textarea
                  id="report-details"
                  required
                  rows={4}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe the matter clearly and objectively..."
                  className="w-full p-sm min-h-[96px] bg-surface-container-low rounded-lg border border-outline-variant/40 focus:border-error focus:ring-2 focus:ring-error/20 text-body-sm text-on-surface focus:outline-none"
                />
              </div>
              <div className="flex gap-sm pt-xs">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 min-h-[48px] bg-surface-container-high text-on-surface text-label-md rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] bg-error text-on-error text-label-md rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-error/30"
                >
                  Send report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
