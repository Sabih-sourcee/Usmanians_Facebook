import React, { useCallback, useEffect, useState } from "react";
import { PostCard } from "../components/PostCard";
import { CommentsSheet } from "../components/CommentsSheet";
import { useAuth } from "../context/AuthContext";
import { fetchNotes } from "../lib/api/notes";

export const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [campus, setCampus] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState<Awaited<ReturnType<typeof fetchNotes>>["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchNotes(user?.id, {
      subject: subject || undefined,
      gradeLevel: gradeLevel || undefined,
      campus: campus || undefined,
      topic: topic || undefined,
    });
    setNotes(data);
    setLoading(false);
  }, [user?.id, subject, gradeLevel, campus, topic]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-md">
      <h2 className="text-headline-md text-on-surface">Study notes library</h2>
      <p className="text-body-sm text-on-surface-variant">
        Search notes by subject, grade, campus, or topic. Only original student work with attestation is listed.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-11 px-md rounded-lg border border-outline-variant/40 bg-surface-container-lowest" />
        <input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="Grade / level" className="h-11 px-md rounded-lg border border-outline-variant/40 bg-surface-container-lowest" />
        <input value={campus} onChange={(e) => setCampus(e.target.value)} placeholder="Campus" className="h-11 px-md rounded-lg border border-outline-variant/40 bg-surface-container-lowest" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic tag" className="h-11 px-md rounded-lg border border-outline-variant/40 bg-surface-container-lowest" />
      </div>

      {loading ? (
        <div className="flex justify-center py-xl">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-lg">No notes match your filters.</p>
      ) : (
        notes.map((note) => (
          <PostCard
            key={note.id}
            post={note}
            showNoteVotes
            onCommentClick={() => setCommentPostId(note.id)}
            onVoteChange={() => void load()}
          />
        ))
      )}

      <CommentsSheet
        targetId={commentPostId}
        onClose={() => setCommentPostId(null)}
        onCountChange={() => void load()}
      />
    </div>
  );
};
