import { supabase } from "../supabase";
import type {
  PrincipalCandidateRow,
  PrincipalVoteResultRow,
  ProfileRow,
  TeacherReportRow,
} from "../../types/database";
import type { CommentView, TeacherReportView } from "../../types/models";
import { DEFAULT_AVATAR } from "../../types/models";
import { formatRelativeTime } from "../time";

type ReportWithReporter = TeacherReportRow & {
  reporter: Pick<ProfileRow, "id" | "full_name" | "avatar_url"> | null;
};

function mapReport(
  row: ReportWithReporter,
  likes: number,
  comments: number,
  liked: boolean
): TeacherReportView {
  const anonymous = row.is_anonymous || !row.reporter_id;
  return {
    id: row.id,
    teacherName: row.teacher_name,
    className: row.class_name,
    category: row.category,
    description: row.description,
    isAnonymous: anonymous,
    reporterId: anonymous ? null : row.reporter_id,
    reporter: {
      name: anonymous ? "Anonymous Student" : row.reporter?.full_name || "Usmanian",
      avatar: anonymous ? DEFAULT_AVATAR : row.reporter?.avatar_url || DEFAULT_AVATAR,
      timestamp: formatRelativeTime(row.created_at),
    },
    likes,
    comments,
    liked,
    createdAt: row.created_at,
  };
}

async function enrichReports(
  rows: ReportWithReporter[],
  userId: string | undefined
): Promise<TeacherReportView[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [{ data: likes }, { data: comments }, { data: myLikes }] = await Promise.all([
    supabase.from("teacher_report_likes").select("report_id").in("report_id", ids),
    supabase.from("teacher_report_comments").select("report_id").in("report_id", ids),
    userId
      ? supabase
          .from("teacher_report_likes")
          .select("report_id")
          .eq("user_id", userId)
          .in("report_id", ids)
      : Promise.resolve({ data: [] as { report_id: string }[] }),
  ]);

  const likeCount = new Map<string, number>();
  const commentCount = new Map<string, number>();
  const likedSet = new Set((myLikes || []).map((l) => l.report_id));

  for (const l of likes || []) {
    likeCount.set(l.report_id, (likeCount.get(l.report_id) || 0) + 1);
  }
  for (const c of comments || []) {
    commentCount.set(c.report_id, (commentCount.get(c.report_id) || 0) + 1);
  }

  return rows.map((row) =>
    mapReport(
      row,
      likeCount.get(row.id) || 0,
      commentCount.get(row.id) || 0,
      likedSet.has(row.id)
    )
  );
}

export async function fetchTeacherReports(userId?: string): Promise<{
  data: TeacherReportView[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("teacher_reports")
    .select("*, reporter:profiles!reporter_id(id, full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { data: [], error: error.message };
  return {
    data: await enrichReports((data || []) as ReportWithReporter[], userId),
    error: null,
  };
}

export async function submitTeacherReport(input: {
  reporterId: string;
  teacherName: string;
  className?: string;
  category?: string;
  description: string;
  isAnonymous: boolean;
}): Promise<{ data: TeacherReportView | null; error: string | null }> {
  const { data, error } = await supabase
    .from("teacher_reports")
    .insert({
      reporter_id: input.isAnonymous ? null : input.reporterId,
      is_anonymous: input.isAnonymous,
      teacher_name: input.teacherName.trim(),
      class_name: input.className?.trim() || null,
      category: input.category?.trim() || null,
      description: input.description.trim(),
    })
    .select("*, reporter:profiles!reporter_id(id, full_name, avatar_url)")
    .single();

  if (error) return { data: null, error: error.message };
  const [view] = await enrichReports([data as ReportWithReporter], input.reporterId);
  return { data: view, error: null };
}

export async function toggleReportLike(
  reportId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<{ error: string | null }> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from("teacher_report_likes")
      .delete()
      .eq("report_id", reportId)
      .eq("user_id", userId);
    return { error: error?.message || null };
  }
  const { error } = await supabase
    .from("teacher_report_likes")
    .insert({ report_id: reportId, user_id: userId });
  return { error: error?.message || null };
}

export async function fetchReportComments(
  reportId: string
): Promise<{ data: CommentView[]; error: string | null }> {
  const { data, error } = await supabase
    .from("teacher_report_comments")
    .select("*, author:profiles!author_id(id, full_name, avatar_url)")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  type Row = {
    id: string;
    report_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author: { id: string; full_name: string | null; avatar_url: string | null } | null;
  };

  return {
    data: ((data || []) as Row[]).map((row) => ({
      id: row.id,
      targetId: row.report_id,
      postId: row.report_id,
      authorId: row.author_id,
      authorName: row.author?.full_name || "Usmanian",
      authorAvatar: row.author?.avatar_url || DEFAULT_AVATAR,
      content: row.content,
      createdAt: row.created_at,
      timestamp: formatRelativeTime(row.created_at),
    })),
    error: null,
  };
}

export async function addReportComment(input: {
  reportId: string;
  authorId: string;
  content: string;
}): Promise<{ data: CommentView | null; error: string | null }> {
  const { data, error } = await supabase
    .from("teacher_report_comments")
    .insert({
      report_id: input.reportId,
      author_id: input.authorId,
      content: input.content.trim(),
    })
    .select("*, author:profiles!author_id(id, full_name, avatar_url)")
    .single();

  if (error) return { data: null, error: error.message };

  const row = data as {
    id: string;
    report_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author: { full_name: string | null; avatar_url: string | null } | null;
  };

  return {
    data: {
      id: row.id,
      targetId: row.report_id,
      postId: row.report_id,
      authorId: row.author_id,
      authorName: row.author?.full_name || "Usmanian",
      authorAvatar: row.author?.avatar_url || DEFAULT_AVATAR,
      content: row.content,
      createdAt: row.created_at,
      timestamp: formatRelativeTime(row.created_at),
    },
    error: null,
  };
}

export async function fetchCandidates(): Promise<{
  data: PrincipalCandidateRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("principal_candidates")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: (data || []) as PrincipalCandidateRow[], error: null };
}

export async function fetchVoteResults(): Promise<{
  data: PrincipalVoteResultRow[];
  error: string | null;
}> {
  const { data, error } = await supabase.from("principal_vote_results").select("*");
  if (error) return { data: [], error: error.message };
  return { data: (data || []) as PrincipalVoteResultRow[], error: null };
}

export async function fetchMyVote(userId: string): Promise<{
  candidateId: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("principal_votes")
    .select("candidate_id")
    .eq("voter_id", userId)
    .maybeSingle();
  if (error) return { candidateId: null, error: error.message };
  return { candidateId: (data?.candidate_id as string | undefined) || null, error: null };
}

export async function castVote(
  voterId: string,
  candidateId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("principal_votes").insert({
    voter_id: voterId,
    candidate_id: candidateId,
  });
  return { error: error?.message || null };
}
