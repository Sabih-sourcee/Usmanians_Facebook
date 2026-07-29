import React, { useEffect, useState } from "react";
import { ProfileHeader } from "../components/ProfileHeader";
import { TabBar, TabItem } from "../components/TabBar";
import { PostCard } from "../components/PostCard";
import { CommentsSheet } from "../components/CommentsSheet";
import { BottomSheet } from "../components/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { fetchPostsByAuthor } from "../lib/api/posts";
import { updateProfile } from "../lib/api/profiles";
import { uploadUserFile } from "../lib/api/storage";
import type { PostView } from "../types/models";

export const ProfilePage: React.FC = () => {
  const { user, profile, logout, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [notes, setNotes] = useState<PostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editCampus, setEditCampus] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchPostsByAuthor(user.id, user.id, "standard"),
      fetchPostsByAuthor(user.id, user.id, "shared_notes"),
    ]).then(([p, n]) => {
      if (cancelled) return;
      setPosts(p.data);
      setNotes(n.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="flex justify-center py-xl">
        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const openEdit = () => {
    setEditName(profile.full_name || user.name);
    setEditBio(profile.bio || "");
    setEditClass(profile.class_name || "");
    setEditCampus(profile.campus || "");
    setAvatarFile(null);
    setCoverFile(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let avatarUrl = profile.avatar_url;
    let coverUrl = profile.cover_url;

    if (avatarFile) {
      const up = await uploadUserFile("avatars", user.id, avatarFile);
      if (up.error) {
        setSaving(false);
        setToast(up.error);
        return;
      }
      avatarUrl = up.publicUrl;
    }
    if (coverFile) {
      const up = await uploadUserFile("avatars", user.id, coverFile);
      if (up.error) {
        setSaving(false);
        setToast(up.error);
        return;
      }
      coverUrl = up.publicUrl;
    }

    const { error } = await updateProfile(user.id, {
      full_name: editName.trim(),
      bio: editBio.trim(),
      class_name: editClass.trim(),
      campus: editCampus.trim(),
      avatar_url: avatarUrl,
      cover_url: coverUrl,
    });
    setSaving(false);
    if (error) {
      setToast(error);
      return;
    }
    setIsEditing(false);
    await refreshProfile();
    setToast("Profile updated");
    setTimeout(() => setToast(null), 2500);
  };

  const tabs: TabItem[] = [
    {
      id: "posts",
      label: "Posts",
      content: loading ? (
        <div className="flex justify-center py-lg">
          <span className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-lg">No posts yet.</p>
      ) : (
        <div className="flex flex-col gap-md">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCommentClick={() => setCommentPostId(post.id)}
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      ),
    },
    {
      id: "notes",
      label: "Shared Notes",
      content: loading ? (
        <div className="flex justify-center py-lg">
          <span className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-lg">No shared notes yet.</p>
      ) : (
        <div className="flex flex-col gap-md">
          {notes.map((note) => (
            <PostCard
              key={note.id}
              post={note}
              onCommentClick={() => setCommentPostId(note.id)}
              onDeleted={(id) => setNotes((prev) => prev.filter((p) => p.id !== id))}
            />
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
              <span className="font-semibold break-words">{user.name}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Official Email</span>
              <span className="font-semibold break-all">{user.email}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Class</span>
              <span className="font-semibold">{profile.class_name || "—"}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Campus</span>
              <span className="font-semibold">{profile.campus || "—"}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Student CID</span>
              <span className="font-semibold">{profile.student_cid || "—"}</span>
            </div>
            <div>
              <span className="text-label-sm text-on-surface-variant block">Status</span>
              <span className="font-semibold text-primary">Verified member</span>
            </div>
          </div>
          <div className="pt-sm border-t border-surface-container-highest">
            <span className="text-label-sm text-on-surface-variant block mb-xs">Biography</span>
            <p className="text-body-md text-on-surface leading-relaxed">{user.bio || "No bio yet."}</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-md">
      {toast && (
        <div className="bg-primary text-on-primary p-md rounded-xl text-center text-body-sm shadow-md fade-toast" role="status">
          {toast}
        </div>
      )}

      <ProfileHeader user={user} onEditProfile={openEdit} />

      <button
        type="button"
        onClick={() => void logout()}
        className="w-full min-h-[48px] rounded-xl border border-outline-variant text-on-surface font-semibold hover:bg-surface-container cursor-pointer"
      >
        Log out
      </button>

      <TabBar tabs={tabs} defaultTabId="posts" />

      <CommentsSheet targetId={commentPostId} targetKind="post" onClose={() => setCommentPostId(null)} />

      <BottomSheet open={isEditing} title="Edit profile" onClose={() => setIsEditing(false)}>
        <form onSubmit={handleSave} className="space-y-md">
          <div className="space-y-xs">
            <label className="text-label-md" htmlFor="edit-name">
              Full name
            </label>
            <input
              id="edit-name"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40"
            />
          </div>
          <div className="space-y-xs">
            <label className="text-label-md" htmlFor="edit-bio">
              Bio
            </label>
            <textarea
              id="edit-bio"
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full px-md py-sm rounded-lg bg-surface-container-low border border-outline-variant/40 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="text-label-md" htmlFor="edit-class">
                Class
              </label>
              <input
                id="edit-class"
                value={editClass}
                onChange={(e) => setEditClass(e.target.value)}
                className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40"
              />
            </div>
            <div className="space-y-xs">
              <label className="text-label-md" htmlFor="edit-campus">
                Campus
              </label>
              <input
                id="edit-campus"
                value={editCampus}
                onChange={(e) => setEditCampus(e.target.value)}
                className="w-full h-12 px-md rounded-lg bg-surface-container-low border border-outline-variant/40"
              />
            </div>
          </div>
          <div className="space-y-xs">
            <label className="text-label-md" htmlFor="edit-avatar">
              Avatar photo
            </label>
            <input
              id="edit-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="w-full text-body-sm"
            />
          </div>
          <div className="space-y-xs">
            <label className="text-label-md" htmlFor="edit-cover">
              Cover photo
            </label>
            <input
              id="edit-cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full text-body-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[48px] bg-primary text-on-primary font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};
