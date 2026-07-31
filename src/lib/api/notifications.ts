import { supabase } from "../supabase";
import type { NotificationRow, ProfileRow } from "../../types/database";
import type { NotificationView } from "../../types/models";
import { formatRelativeTime } from "../time";
import type { RealtimeChannel } from "@supabase/supabase-js";

function titleFor(type: string): string {
  switch (type) {
    case "post_like":
      return "New like";
    case "post_comment":
      return "New comment";
    case "friend_request":
      return "Friend request";
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
    case "friend_request":
      return `${name} sent you a friend request.`;
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

async function actorNamesFor(rows: NotificationRow[]): Promise<Map<string, string>> {
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (!actorIds.length) return names;

  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
  for (const p of (profiles || []) as Pick<ProfileRow, "id" | "full_name">[]) {
    names.set(p.id, p.full_name || "Usmanian");
  }
  return names;
}

export function notificationRowToView(
  row: NotificationRow,
  actorName: string | null = null
): NotificationView {
  return {
    id: row.id,
    type: row.type,
    title: titleFor(row.type),
    description: descriptionFor(row.type, actorName),
    time: formatRelativeTime(row.created_at),
    read: row.is_read,
    actorId: row.actor_id,
    referenceId: row.reference_id,
  };
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
  const names = await actorNamesFor(rows);

  const views: NotificationView[] = rows.map((row) =>
    notificationRowToView(row, row.actor_id ? names.get(row.actor_id) || null : null)
  );

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

/** Enrich a realtime INSERT payload into a NotificationView (fetches actor name). */
export async function viewFromNotificationRow(row: NotificationRow): Promise<NotificationView> {
  let actorName: string | null = null;
  if (row.actor_id) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", row.actor_id)
      .maybeSingle();
    actorName = (data as { full_name: string | null } | null)?.full_name || null;
  }
  return notificationRowToView(row, actorName);
}

/**
 * Live subscription for the recipient's notifications.
 * Column is `user_id` (not recipient_id) — matches public.notifications schema.
 * Pass a unique `channelKey` when multiple components subscribe at once.
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (row: NotificationRow) => void,
  channelKey = "default"
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications-${channelKey}-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onInsert(payload.new as NotificationRow);
      }
    )
    .subscribe();

  return channel;
}
