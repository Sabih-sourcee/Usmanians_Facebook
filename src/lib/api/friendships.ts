import { supabase } from "../supabase";
import type { FriendshipRow, ProfileRow } from "../../types/database";

export type FriendListItem = {
  friendship: FriendshipRow;
  profile: ProfileRow;
  direction: "outgoing" | "incoming" | "accepted";
};

export async function countFriends(userId: string): Promise<number> {
  const { count } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "accepted");
  return count || 0;
}

export async function fetchFriendships(userId: string): Promise<{
  data: FriendListItem[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .neq("status", "blocked")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  const rows = (data || []) as FriendshipRow[];
  const otherIds = [
    ...new Set(rows.map((r) => (r.user_id === userId ? r.friend_id : r.user_id))),
  ];

  if (!otherIds.length) return { data: [], error: null };

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .in("id", otherIds);

  if (pErr) return { data: [], error: pErr.message };

  const map = new Map(((profiles || []) as ProfileRow[]).map((p) => [p.id, p]));

  const items: FriendListItem[] = [];
  for (const row of rows) {
    const otherId = row.user_id === userId ? row.friend_id : row.user_id;
    const profile = map.get(otherId);
    if (!profile) continue;

    let direction: FriendListItem["direction"] = "accepted";
    if (row.status === "pending") {
      direction = row.user_id === userId ? "outgoing" : "incoming";
    }

    if (row.status === "accepted" && row.user_id !== userId) continue;

    items.push({ friendship: row, profile, direction });
  }

  return { data: items, error: null };
}

export async function sendFriendRequest(
  fromId: string,
  toId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("friendships").insert({
    user_id: fromId,
    friend_id: toId,
    status: "pending",
  });
  return { error: error?.message || null };
}

export async function respondFriendRequest(
  requesterId: string,
  myId: string,
  accept: boolean
): Promise<{ error: string | null }> {
  if (accept) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("user_id", requesterId)
      .eq("friend_id", myId);
    return { error: error?.message || null };
  }
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("user_id", requesterId)
    .eq("friend_id", myId);
  return { error: error?.message || null };
}

export async function removeFriendship(
  userId: string,
  friendId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
    );
  return { error: error?.message || null };
}
