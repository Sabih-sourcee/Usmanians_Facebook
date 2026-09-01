import { supabase } from "../supabase";
import type { ExplainerVideoRow } from "../../types/database";
import type { ExplainerVideoView, PostView } from "../../types/models";
import { enrichPostsWithVotes } from "./posts";
import type { PostRow, ProfileRow } from "../../types/database";

type NoteRow = PostRow & {
  author: Pick<ProfileRow, "id" | "full_name" | "avatar_url"> | null;
};

export interface NotesBrowseFilters {
  subject?: string;
  gradeLevel?: string;
  campus?: string;
  topic?: string;
}

export async function fetchNotes(
  userId: string | undefined,
  filters: NotesBrowseFilters = {}
): Promise<{ data: PostView[]; error: string | null }> {
  let query = supabase
    .from("posts")
    .select("*, author:profiles!author_id(id, full_name, avatar_url)")
    .eq("type", "shared_notes")
    .eq("attestation_accepted", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters.subject) query = query.ilike("subject", `%${filters.subject}%`);
  if (filters.gradeLevel) query = query.eq("grade_level", filters.gradeLevel);
  if (filters.campus) query = query.ilike("note_campus", `%${filters.campus}%`);
  if (filters.topic) query = query.ilike("topic_tag", `%${filters.topic}%`);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: await enrichPostsWithVotes((data || []) as NoteRow[], userId), error: null };
}

export async function submitExplainerVideo(input: {
  userId: string;
  title: string;
  description?: string;
  videoUrl?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from("explainer_video_submissions").insert({
    user_id: input.userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    video_url: input.videoUrl?.trim() || null,
    status: "pending",
  });
  return { error: error?.message || null };
}

export async function fetchPendingExplainerVideos(): Promise<{
  data: ExplainerVideoView[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("explainer_video_submissions")
    .select("*, user:profiles!user_id(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) return { data: [], error: error.message };

  type Row = ExplainerVideoRow & { user: { full_name: string | null } | null };
  return {
    data: ((data || []) as Row[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user?.full_name || "Usmanian",
      title: r.title,
      description: r.description,
      videoUrl: r.video_url,
      status: r.status as ExplainerVideoView["status"],
      pointsAwarded: r.points_awarded,
      createdAt: r.created_at,
    })),
    error: null,
  };
}

export async function reviewExplainerVideo(
  submissionId: string,
  approve: boolean,
  points = 100
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_award_explainer_video", {
    p_submission_id: submissionId,
    p_points: points,
    p_approve: approve,
  });
  return { error: error?.message || null };
}
