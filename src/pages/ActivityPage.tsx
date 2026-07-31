import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  viewFromNotificationRow,
} from "../lib/api/notifications";
import { supabase } from "../lib/supabase";
import type { NotificationView } from "../types/models";

export const ActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, unread: u, error: err } = await fetchNotifications(user.id);
    setLoading(false);
    if (err) setError(err);
    else {
      setError(null);
      setItems(data);
      setUnread(u);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;

    const channel = subscribeToNotifications(
      user.id,
      (row) => {
        void viewFromNotificationRow(row).then((view) => {
          setItems((prev) => {
            if (prev.some((n) => n.id === view.id)) return prev;
            return [view, ...prev];
          });
          if (!view.read) setUnread((n) => n + 1);
        });
      },
      "activity"
    );

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  const iconFor = (type: string) => {
    if (type.includes("like")) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (type.includes("comment")) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (type.includes("friend")) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col w-full gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-headline-md text-on-surface">Recent Activity</h2>
        <div className="flex items-center gap-sm">
          {unread > 0 && (
            <span className="inline-flex items-center gap-xs text-label-sm text-primary bg-primary-fixed px-sm py-xs rounded-lg font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              {unread} unread
            </span>
          )}
          {unread > 0 && (
            <button
              type="button"
              className="min-h-[44px] px-sm text-label-md text-primary font-semibold cursor-pointer"
              onClick={async () => {
                await markAllNotificationsRead(user.id);
                await load();
              }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-xl">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-error text-body-md" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-lg text-center">
          <p className="text-body-md text-on-surface-variant">No notifications yet.</p>
        </div>
      )}

      <ul className="flex flex-col gap-sm list-none p-0 m-0">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`w-full text-left bg-surface-container-lowest rounded-xl p-md border flex items-start gap-md cursor-pointer ${
                item.read ? "border-outline-variant" : "border-l-4 border-l-primary border-outline-variant"
              }`}
              onClick={async () => {
                if (!item.read) {
                  await markNotificationRead(item.id);
                  setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
                  setUnread((u) => Math.max(0, u - 1));
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                {iconFor(item.type)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-start justify-between gap-sm">
                  <span className="text-body-md font-semibold text-on-surface">
                    {item.title}
                    {!item.read && <span className="sr-only"> (unread)</span>}
                  </span>
                  <time className="text-label-sm text-on-surface-variant shrink-0">{item.time}</time>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-xs">{item.description}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
