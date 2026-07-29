import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchUnreadCount } from "../lib/api/notifications";
import { searchProfiles } from "../lib/api/profiles";
import { sendFriendRequest } from "../lib/api/friendships";
import { BottomSheet } from "./BottomSheet";
import type { ProfileRow } from "../types/database";
import { DEFAULT_AVATAR } from "../types/models";

interface HeaderProps {
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle = "Home" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    void fetchUnreadCount(user.id).then(setUnread);
    const id = window.setInterval(() => {
      void fetchUnreadCount(user.id).then(setUnread);
    }, 30000);
    return () => window.clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!searchOpen || !user || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      searchProfiles(query, user.id).then(({ data }) => {
        setResults(data);
        setSearching(false);
      });
    }, 280);
    return () => window.clearTimeout(t);
  }, [query, searchOpen, user]);

  const avatarUrl = user?.avatar || DEFAULT_AVATAR;
  const showPageLabel = pageTitle !== "Home";

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/25 pt-safe">
      <div className="max-w-2xl mx-auto">
        <div className="h-14 px-margin-mobile flex items-center justify-between gap-sm">
          <Link
            to="/"
            className="flex items-center gap-sm min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
          >
            <span className="shrink-0 p-0.5 bg-surface-container-lowest rounded-full border border-outline-variant">
              <img
                alt=""
                className="h-8 w-8 object-contain"
                width={32}
                height={32}
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVIUzDnIFUHGtQMvhfXn3_Wvt8RQ4LP6sY9fsXDrBirg&s=10"
              />
            </span>
            <div className="min-w-0 flex flex-col">
              <span className="font-headline-md text-[20px] leading-none text-primary tracking-tight truncate font-semibold">
                Usmanian
              </span>
              {showPageLabel && (
                <span className="text-label-sm text-on-surface-variant leading-tight truncate mt-0.5">
                  {pageTitle}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              aria-label="Search students"
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-full cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
              onClick={() => navigate("/activity")}
              className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-full relative cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unread > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full" aria-hidden="true" />
              )}
            </button>
            <Link
              to="/profile"
              aria-label="View your profile"
              className="ml-1 w-11 h-11 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <img
                alt=""
                className="w-9 h-9 rounded-full object-cover ring-2 ring-outline-variant/40"
                src={avatarUrl}
              />
            </Link>
          </div>
        </div>
      </div>

      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(56px+env(safe-area-inset-top)+8px)] z-50 bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-lg text-body-sm shadow-lg fade-toast max-w-[90%]">
          {toast}
        </div>
      )}

      <BottomSheet
        open={searchOpen}
        title="Search students"
        onClose={() => {
          setSearchOpen(false);
          setQuery("");
          setResults([]);
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or CID"
          className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40 mb-md"
        />
        {searching && <p className="text-label-sm text-on-surface-variant mb-sm">Searching…</p>}
        <ul className="flex flex-col gap-sm list-none p-0 m-0">
          {results.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-md p-sm rounded-lg bg-surface-container-low"
            >
              <div className="flex items-center gap-sm min-w-0">
                <img src={p.avatar_url || DEFAULT_AVATAR} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.full_name}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">{p.student_cid}</p>
                </div>
              </div>
              {user && (
                <button
                  type="button"
                  className="min-h-[44px] px-md bg-primary text-on-primary rounded-lg text-label-md font-semibold shrink-0 cursor-pointer"
                  onClick={async () => {
                    const { error } = await sendFriendRequest(user.id, p.id);
                    setToast(error || "Friend request sent");
                    setTimeout(() => setToast(null), 2500);
                    if (!error) {
                      setSearchOpen(false);
                      navigate("/friends");
                    }
                  }}
                >
                  Add
                </button>
              )}
            </li>
          ))}
        </ul>
        {query.trim().length >= 2 && !searching && results.length === 0 && (
          <p className="text-body-md text-on-surface-variant text-center py-md">No matches.</p>
        )}
      </BottomSheet>
    </header>
  );
};
