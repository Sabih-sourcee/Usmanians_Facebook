import { supabase } from "../supabase";
import type { ProfileRow } from "../../types/database";
import { DEFAULT_AVATAR, DEFAULT_COVER, type UserProfile } from "../../types/models";
import { countPostsByAuthor } from "./posts";
import { countFriends } from "./friendships";

export function profileToUser(
  profile: ProfileRow,
  email: string,
  stats?: { posts: number; followers: number; notes: number }
): UserProfile {
  const classPart = profile.class_name?.trim();
  const campusPart = profile.campus?.trim();
  const badgeParts = [classPart, campusPart].filter(Boolean);

  return {
    id: profile.id,
    name: profile.full_name || email || "Usmanian",
    email,
    avatar: profile.avatar_url || DEFAULT_AVATAR,
    coverImage: profile.cover_url || DEFAULT_COVER,
    badgeText: badgeParts.length
      ? badgeParts.map((p) => p!.toUpperCase()).join(" • ")
      : "USMANIAN",
    bio: profile.bio || "",
    stats: stats || { posts: 0, followers: 0, notes: 0 },
  };
}

export async function updateProfile(
  userId: string,
  patch: Partial<
    Pick<ProfileRow, "full_name" | "bio" | "class_name" | "campus" | "avatar_url" | "cover_url">
  >
): Promise<{ data: ProfileRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as ProfileRow, error: null };
}

export async function searchProfiles(
  query: string,
  excludeId?: string
): Promise<{ data: ProfileRow[]; error: string | null }> {
  const q = query.trim();
  if (!q) return { data: [], error: null };

  let builder = supabase
    .from("profiles")
    .select("*")
    .eq("verification_status", "approved")
    .or(`full_name.ilike.%${q}%,student_cid.ilike.%${q}%`)
    .limit(20);

  if (excludeId) builder = builder.neq("id", excludeId);

  const { data, error } = await builder;
  if (error) return { data: [], error: error.message };
  return { data: (data || []) as ProfileRow[], error: null };
}

export async function fetchPendingProfiles(): Promise<{
  data: ProfileRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: (data || []) as ProfileRow[], error: null };
}

export async function setVerificationStatus(
  userId: string,
  status: "approved" | "rejected"
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: status })
    .eq("id", userId);
  return { error: error?.message || null };
}

export async function loadProfileStats(userId: string): Promise<{
  posts: number;
  followers: number;
  notes: number;
}> {
  const [counts, friends] = await Promise.all([
    countPostsByAuthor(userId),
    countFriends(userId),
  ]);
  return { posts: counts.posts, notes: counts.notes, followers: friends };
}
