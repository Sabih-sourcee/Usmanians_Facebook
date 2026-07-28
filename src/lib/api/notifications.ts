import { supabase } from "../supabase";
import type { NotificationRow, ProfileRow } from "../../types/database";
import type { NotificationView } from "../../types/models";
import { formatRelativeTime } from "../time";

function titleFor(type: string): string {
  switch (type) {
    case "post_like":
      return "New like";
    case "post_comment":
      return "New comment";
    case "friend_accepted":
      return "Friend request accepted";
    case "verification_approved":
      return "Account approved";
    case "verification_rejected":
      return "Account not approved";
    default:
      return "Notification";
  }
}

function descriptionFor(type: string, actorName: string | null): string {
  const name = actorName || "Someone";
  switch (type) {
    case "post_like":
      return `${name} liked your post.`;
    case "post_comment":
      return `${name} commented on your post.`;
    case "friend_accepted":
      return `${name} accepted your friend request.`;
    case "verification_approved":
      return "You are now a verified Usmanian.";
    case "verification_rejected":
      return "Your registration was not approved. Contact school admin.";
    default:
      return "You have a new update.";
  }
}

export async function fetchNotifications(userId: string): Promise<{
  data: NotificationView[];
  unread: number;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { data: [], unread: 0, error: error.message };

  const rows = (data || []) as NotificationRow[];
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  let actors = new Map<string, ProfileRow>();

  if (actorIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", actorIds);
    actors = new Map(((profiles || []) as ProfileRow[]).map((p) => [p.id, p]));
  }

  const views: NotificationView[] = rows.map((row) => {
    const actor = row.actor_id ? actors.get(row.actor_id) : null;
    return {
      id: row.id,
      type: row.type,
      title: titleFor(row.type),
      description: descriptionFor(row.type, actor?.full_name || null),
      time: formatRelativeTime(row.created_at),
      read: row.is_read,
      actorId: row.actor_id,
      referenceId: row.reference_id,
    };
  });

  return {
    data: views,
    unread: views.filter((v) => !v.read).length,
    error: null,
  };
}

export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  return { error: error?.message || null };
}

export async function markAllNotificationsRead(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { error: error?.message || null };
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count || 0;
}
