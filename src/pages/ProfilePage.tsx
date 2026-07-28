import React, { useEffect, useId, useRef, useState } from "react";
import { ProfileHeader } from "../components/ProfileHeader";
import { TabBar, TabItem } from "../components/TabBar";
import { PostCard } from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { mockUser, UserProfile } from "../data/mockUser";
import { profilePosts, profileNotes } from "../data/mockPosts";

export const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserProfile>(authUser || mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editBadge, setEditBadge] = useState(currentUser.badgeText);
  const [editToast, setEditToast] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isEditing) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEditing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditing]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser((prev) => ({
      ...prev,
      bio: editBio,
      badgeText: editBadge,
    }));
    setIsEditing(false);
    setEditToast("Profile updated successfully");
    setTimeout(() => setEditToast(null), 3000);
  };

  const tabs: TabItem[] = [
    {
      id: "posts",
      label: "Posts",
      content: (
        <div className="flex flex-col gap-md">
          {profilePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ),
    },
    {
      id: "notes",
      label: "Shared Notes",
      content: (
        <div className="flex flex-col gap-md">
          {profileNotes.map((note) => (
            <PostCard key={note.id} post={note} />
          ))}
        </div>
      ),
    },
    {
      id: "about",
      label: "About",
      content: (
        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 space-y-md">
          <h3 className="text-headline-md text-on-surface border-b border-surface-container-highest pb-sm">
            Student Profile Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md text-body-md text-on-surface">
            <div>
              <span className="text-label-sm text-on-surface-variant block">Full Name</span>
              <span className="font-semibold">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Official Email</span>
              <span className="font-semibold">{currentUser.email}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Academic Grade &amp; Campus</span>
              <span className="font-semibold">{currentUser.badgeText}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Student Portal Status</span>
              <span className="font-semibold text-primary">Verified member</span>
            </div>
          </div>
          <div className="pt-sm border-t border-surface-container-highest">
            <span className="text-label-sm text-on-surface-variant block mb-xs">Biography</span>
            <p className="text-body-md text-on-surface leading-relaxed">{currentUser.bio}</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <div aria-live="polite" className="sr-only">
        {editToast}
      </div>
      {editToast && (
        <div className="mb-md bg-primary text-on-primary p-md rounded-xl text-center text-body-sm shadow-md fade-toast" role="status">
          {editToast}
        </div>
      )}

      <ProfileHeader
        user={currentUser}
        onEditProfile={() => {
          setEditBio(currentUser.bio);
          setEditBadge(currentUser.badgeText);
          setIsEditing(true);
        }}
      />

      <TabBar tabs={tabs} defaultTabId="posts" />

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-md bg-black/50"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-surface-container-lowest w-full max-w-md rounded-xl p-lg shadow-xl space-y-md border border-outline-variant/20"
          >
            <div className="flex justify-between items-center gap-sm">
              <h3 id={titleId} className="text-headline-md text-on-surface">
                Edit Profile
              </h3>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={() => setIsEditing(false)}
                className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-md">
              <div className="space-y-xs">
                <label className="text-label-md text-on-surface block" htmlFor="edit-badge">
                  Class Badge / Campus
                </label>
                <input
                  id="edit-badge"
                  type="text"
                  value={editBadge}
                  onChange={(e) => setEditBadge(e.target.value)}
                  className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface focus:outline-none"
                />
              </div>

              <div className="space-y-xs">
                <label className="text-label-md text-on-surface block" htmlFor="edit-bio">
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-sm bg-surface-container-low rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface focus:outline-none"
                />
              </div>

              <div className="flex gap-sm pt-xs">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 min-h-[48px] bg-surface-container-high text-on-surface text-label-md rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] bg-primary text-on-primary text-label-md rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
