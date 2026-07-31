// @ts-nocheck — Deno Edge Function (not part of the Vite/TS app compile)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-usmanian-push-secret",
};

type NotificationRecord = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  reference_id: string | null;
  is_read?: boolean;
  created_at?: string;
};

function titleFor(type: string): string {
  switch (type) {
    case "post_like":
      return "New like";
    case "post_comment":
      return "New comment";
    case "comment_reply":
      return "New reply";
    case "friend_request":
      return "New friend request";
    case "friend_accepted":
    case "friend_accept":
      return "Friend request accepted";
    case "verification_approved":
    case "account_approved":
      return "You're verified!";
    case "verification_rejected":
      return "Account not approved";
    case "event_rsvp_confirmed":
      return "RSVP confirmed";
    default:
      return "Usmanian";
  }
}

function bodyFor(type: string, actorName: string): string {
  switch (type) {
    case "post_like":
      return `${actorName} liked your post`;
    case "post_comment":
      return `${actorName} commented on your post`;
    case "comment_reply":
      return `${actorName} replied to your comment`;
    case "friend_request":
      return `${actorName} wants to connect`;
    case "friend_accepted":
    case "friend_accept":
      return `${actorName} accepted your request`;
    case "verification_approved":
    case "account_approved":
      return "Your Usmanian account has been approved";
    case "verification_rejected":
      return "Your registration was not approved. Contact school admin.";
    case "event_rsvp_confirmed":
      return "You're going — open Usmanian for details";
    default:
      return "You have a new update";
  }
}

function urlFor(type: string, referenceId: string | null): string {
  switch (type) {
    case "friend_request":
    case "friend_accepted":
    case "friend_accept":
      return "/friends";
    case "post_like":
    case "post_comment":
    case "comment_reply":
      return referenceId ? `/?post=${referenceId}` : "/";
    case "verification_approved":
    case "verification_rejected":
    case "account_approved":
      return "/profile";
    default:
      return "/activity";
  }
}

function authorize(req: Request): boolean {
  const webhookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET") || "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const headerSecret = req.headers.get("x-usmanian-push-secret") || "";

  if (webhookSecret && (bearer === webhookSecret || headerSecret === webhookSecret)) {
    return true;
  }
  if (serviceRole && bearer === serviceRole) {
    return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!authorize(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@usmanian.app";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!vapidPublic || !vapidPrivate || !supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "Missing server configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let payload: { record?: NotificationRecord; type?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const record = payload.record;
  if (!record?.user_id || !record?.type) {
    return new Response(JSON.stringify({ error: "Missing notification record" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Mirror DB self-skip: never push for a user's own action
  if (record.actor_id && record.actor_id === record.user_id) {
    return new Response(JSON.stringify({ ok: true, skipped: "self" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  let actorName = "Someone";
  if (record.actor_id) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", record.actor_id)
      .maybeSingle();
    if (actor?.full_name) actorName = actor.full_name;
  }

  const title = titleFor(record.type);
  const body = bodyFor(record.type, actorName);
  const url = urlFor(record.type, record.reference_id);

  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh_key, auth_key")
    .eq("user_id", record.user_id);

  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!subs?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pushPayload = JSON.stringify({
    title,
    body,
    url,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: `usmanian-${record.type}-${record.id}`,
  });

  let sent = 0;
  const removed: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          },
          pushPayload
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          removed.push(sub.id);
        } else {
          console.error("push failed", sub.id, err);
        }
      }
    })
  );

  return new Response(JSON.stringify({ ok: true, sent, removed: removed.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
