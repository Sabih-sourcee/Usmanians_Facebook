import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchFriendships,
  removeFriendship,
  respondFriendRequest,
  sendFriendRequest,
  type FriendListItem,
} from "../lib/api/friendships";
import { searchProfiles } from "../lib/api/profiles";
import type { ProfileRow } from "../types/database";
import { DEFAULT_AVATAR } from "../types/models";

export const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<FriendListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await fetchFriendships(user.id);
    setLoading(false);
    if (error) setMessage(error);
    else setItems(data);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      searchProfiles(query, user.id).then(({ data }) => {
        setResults(data);
        setSearching(false);
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, user]);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  };

  if (!user) return null;

  const incoming = items.filter((i) => i.direction === "incoming");
  const outgoing = items.filter((i) => i.direction === "outgoing");
  const friends = items.filter((i) => i.direction === "accepted");

  return (
    <div className="flex flex-col w-full gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-headline-md text-on-surface">Friends</h2>
      </div>

      {message && (
        <div className="bg-primary text-on-primary p-md rounded-xl text-body-sm text-center" role="status">
          {message}
        </div>
      )}

      <div className="space-y-xs">
        <label className="text-label-md text-on-surface" htmlFor="friend-search">
          Find students
        </label>
        <input
          id="friend-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or CID"
          className="w-full h-12 px-md rounded-lg bg-surface-container-lowest border border-outline-variant/40"
        />
      </div>

      {searching && <p className="text-label-sm text-on-surface-variant">Searching…</p>}

      {results.length > 0 && (
        <ul className="flex flex-col gap-sm list-none p-0 m-0">
          {results.map((p) => (
            <li
              key={p.id}
              className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex items-center justify-between gap-md"
            >
              <div className="flex items-center gap-md min-w-0">
                <img
                  src={p.avatar_url || DEFAULT_AVATAR}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-body-md font-semibold truncate">{p.full_name || "Usmanian"}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">
                    {[p.class_name, p.campus].filter(Boolean).join(" · ") || p.student_cid || ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="min-h-[44px] px-md bg-primary text-on-primary rounded-lg text-label-md font-semibold shrink-0 cursor-pointer"
                onClick={async () => {
                  const { error } = await sendFriendRequest(user.id, p.id);
                  if (error) flash(error);
                  else {
                    flash("Request sent");
                    setQuery("");
                    setResults([]);
                    await load();
                  }
                }}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <div className="flex justify-center py-xl">
          <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {incoming.length > 0 && (
            <section className="space-y-sm">
              <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                Requests
              </h3>
              {incoming.map((item) => (
                <div
                  key={`${item.friendship.user_id}-${item.friendship.friend_id}`}
                  className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-md min-w-0">
                    <img
                      src={item.profile.avatar_url || DEFAULT_AVATAR}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <span className="font-semibold truncate">{item.profile.full_name}</span>
                  </div>
                  <div className="flex gap-sm">
                    <button
                      type="button"
                      className="min-h-[44px] flex-1 sm:flex-none px-md bg-primary text-on-primary rounded-lg font-semibold cursor-pointer"
                      onClick={async () => {
                        const { error } = await respondFriendRequest(
                          item.friendship.user_id,
                          user.id,
                          true
                        );
                        if (error) flash(error);
                        else await load();
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="min-h-[44px] flex-1 sm:flex-none px-md bg-surface-container-high rounded-lg font-semibold cursor-pointer"
                      onClick={async () => {
                        const { error } = await respondFriendRequest(
                          item.friendship.user_id,
                          user.id,
                          false
                        );
                        if (error) flash(error);
                        else await load();
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {outgoing.length > 0 && (
            <section className="space-y-sm">
              <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                Sent
              </h3>
              {outgoing.map((item) => (
                <div
                  key={`out-${item.friendship.friend_id}`}
                  className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex items-center justify-between gap-md"
                >
                  <span className="font-semibold truncate">{item.profile.full_name}</span>
                  <span className="text-label-sm text-on-surface-variant">Pending</span>
                </div>
              ))}
            </section>
          )}

          <section className="space-y-sm">
            <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
              Your friends ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <p className="text-body-md text-on-surface-variant text-center py-lg">
                No friends yet. Search above to connect.
              </p>
            ) : (
              friends.map((item) => (
                <div
                  key={`f-${item.profile.id}`}
                  className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex items-center justify-between gap-md"
                >
                  <div className="flex items-center gap-md min-w-0">
                    <img
                      src={item.profile.avatar_url || DEFAULT_AVATAR}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.profile.full_name}</p>
                      <p className="text-label-sm text-on-surface-variant truncate">
                        {[item.profile.class_name, item.profile.campus].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="min-h-[44px] px-md text-error text-label-md font-semibold cursor-pointer"
                    onClick={async () => {
                      const { error } = await removeFriendship(user.id, item.profile.id);
                      if (error) flash(error);
                      else await load();
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
};
