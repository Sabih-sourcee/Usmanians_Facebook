import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../lib/api/posts";
import { uploadUserFile } from "../lib/api/storage";
import type { PostView } from "../types/models";

interface PostComposerProps {
  onCreated: (post: PostView) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile && !attachFile) {
      setError("Write something or add a photo/file.");
      return;
    }
    setBusy(true);
    setError(null);

    let imageUrl: string | null = null;
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    const type = attachFile ? "shared_notes" : "standard";

    if (imageFile) {
      const up = await uploadUserFile("post-images", user.id, imageFile);
      if (up.error) {
        setBusy(false);
        setError(up.error);
        return;
      }
      imageUrl = up.publicUrl;
    }

    if (attachFile) {
      const up = await uploadUserFile("attachments", user.id, attachFile);
      if (up.error) {
        setBusy(false);
        setError(up.error);
        return;
      }
      attachmentUrl = up.publicUrl;
      attachmentName = attachFile.name;
    }

    const { data, error: createError } = await createPost({
      authorId: user.id,
      content: content.trim() || (attachFile ? `Shared ${attachFile.name}` : "Shared a photo"),
      type,
      imageUrl,
      attachmentUrl,
      attachmentName,
      subject: subject.trim() || null,
    });

    setBusy(false);
    if (createError || !data) {
      setError(createError || "Could not create post");
      return;
    }

    setContent("");
    setSubject("");
    setImageFile(null);
    setAttachFile(null);
    if (imageRef.current) imageRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
    onCreated(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-md space-y-sm"
    >
      <div className="flex gap-sm items-start">
        <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" width={40} height={40} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an update with Usmanians…"
          rows={3}
          className="w-full min-h-[72px] resize-none bg-surface-container-low rounded-lg px-sm py-sm text-body-md text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {(imageFile || attachFile) && (
        <div className="flex flex-wrap gap-xs text-label-sm text-on-surface-variant">
          {imageFile && <span className="px-sm py-xs bg-surface-container rounded-lg">Photo: {imageFile.name}</span>}
          {attachFile && <span className="px-sm py-xs bg-surface-container rounded-lg">File: {attachFile.name}</span>}
        </div>
      )}

      {attachFile && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (optional)"
          className="w-full h-11 px-sm rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-md"
        />
      )}

      {error && (
        <p className="text-label-md text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-sm flex-wrap">
        <div className="flex items-center gap-0.5">
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id="composer-image"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="composer-image"
            className="min-h-[44px] min-w-[44px] px-sm inline-flex items-center justify-center text-on-surface-variant hover:text-primary rounded-lg cursor-pointer"
          >
            Photo
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            className="sr-only"
            id="composer-file"
            onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="composer-file"
            className="min-h-[44px] min-w-[44px] px-sm inline-flex items-center justify-center text-on-surface-variant hover:text-primary rounded-lg cursor-pointer"
          >
            Notes
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] px-lg bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
};
