import { supabase } from "../supabase";
import type { PrincipalCandidateRow, PrincipalVoteResultRow } from "../../types/database";

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

export async function submitTeacherReport(input: {
  reporterId: string;
  teacherName: string;
  className?: string;
  category?: string;
  description: string;
  isAnonymous: boolean;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from("teacher_reports").insert({
    reporter_id: input.isAnonymous ? null : input.reporterId,
    is_anonymous: input.isAnonymous,
    teacher_name: input.teacherName.trim(),
    class_name: input.className?.trim() || null,
    category: input.category?.trim() || null,
    description: input.description.trim(),
  });
  return { error: error?.message || null };
}
