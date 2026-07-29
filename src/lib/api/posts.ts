import { supabase } from "../supabase";
import type { PostRow, ProfileRow } from "../../types/database";
import type { CommentView, FeedItem, PostView } from "../../types/models";
import { DEFAULT_AVATAR } from "../../types/models";
import { formatRelativeTime } from "../time";
import { fetchTeacherReports } from "./civic";

type PostWithAuthor = PostRow & {
  author: Pick<ProfileRow, "id" | "full_name" | "avatar_url"> | null;
};

function mapPost(
  row: PostWithAuthor,
  likes: number,
  comments: number,
  liked: boolean
): PostView {
  const isNotes = row.type === "shared_notes";
  return {
    id: row.id,
    authorId: row.author_id,
    author: {
      name: row.author?.full_name || "Usmanian",
      avatar: row.author?.avatar_url || DEFAULT_AVATAR,
      timestamp: formatRelativeTime(row.created_at),
    },
    content: row.content,
    type: isNotes ? "notes" : "standard",
    categoryHeader: isNotes ? "Shared Note" : undefined,
    imageUrl: row.image_url,
    attachment:
      row.attachment_name || row.attachment_url
        ? {
            fileName: row.attachment_name || "Attachment",
            downloadUrl: row.attachment_url || undefined,
            categories: row.subject ? [row.subject] : undefined,
            imageUrl: row.image_url || undefined,
          }
        : row.image_url
          ? {
              fileName: "Photo",
              imageUrl: row.image_url,
            }
          : undefined,
    likes,
    comments,
    liked,
    createdAt: row.created_at,
  };
}

async function enrichPosts(rows: PostWithAuthor[], userId: string | undefined): Promise<PostView[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [{ data: likes }, { data: comments }, { data: myLikes }] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    userId
      ? supabase.from("post_likes").select("post_id").eq("user_id", userId).in("post_id", ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const likeCount = new Map<string, number>();
  const commentCount = new Map<string, number>();
  const likedSet = new Set((myLikes || []).map((l) => l.post_id));

  for (const l of likes || []) {
    likeCount.set(l.post_id, (likeCount.get(l.post_id) || 0) + 1);
  }
  for (const c of comments || []) {
    commentCount.set(c.post_id, (commentCount.get(c.post_id) || 0) + 1);
  }

  return rows.map((row) =>
    mapPost(row, likeCount.get(row.id) || 0, commentCount.get(row.id) || 0, likedSet.has(row.id))
  );
}

export async function fetchFeed(userId?: string): Promise<{ data: FeedItem[]; error: string | null }> {
  const [postsResult, reportsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles!author_id(id, full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50),
    fetchTeacherReports(userId),
  ]);

  if (postsResult.error && reportsResult.error) {
    return { data: [], error: postsResult.error.message };
  }

  const posts = postsResult.error
    ? []
    : await enrichPosts((postsResult.data || []) as PostWithAuthor[], userId);
  const reports = reportsResult.data;

  const items: FeedItem[] = [
    ...posts.map((post) => ({
      kind: "post" as const,
      createdAt: post.createdAt || "",
      post,
    })),
    ...reports.map((report) => ({
      kind: "teacher-report" as const,
      createdAt: report.createdAt,
      report,
    })),
  ];

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  const warning = postsResult.error
    ? postsResult.error.message
    : reportsResult.error
      ? reportsResult.error
      : null;

  return { data: items.slice(0, 50), error: warning };
}

export async function fetchPostsByAuthor(
  authorId: string,
  userId?: string,
  type?: "standard" | "shared_notes"
): Promise<{ data: PostView[]; error: string | null }> {
  let query = supabase
    .from("posts")
    .select("*, author:profiles!author_id(id, full_name, avatar_url)")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: await enrichPosts((data || []) as PostWithAuthor[], userId), error: null };
}

export async function createPost(input: {
  authorId: string;
  content: string;
  type?: "standard" | "shared_notes";
  imageUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  subject?: string | null;
}): Promise<{ data: PostView | null; error: string | null }> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: input.authorId,
      content: input.content.trim(),
      type: input.type || "standard",
      image_url: input.imageUrl || null,
      attachment_url: input.attachmentUrl || null,
      attachment_name: input.attachmentName || null,
      subject: input.subject || null,
    })
    .select("*, author:profiles!author_id(id, full_name, avatar_url)")
    .single();

  if (error) return { data: null, error: error.message };
  const [view] = await enrichPosts([data as PostWithAuthor], input.authorId);
  return { data: view, error: null };
}

export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  return { error: error?.message || null };
}

export async function toggleLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<{ error: string | null }> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    return { error: error?.message || null };
  }
  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  return { error: error?.message || null };
}

export async function fetchComments(
  postId: string
): Promise<{ data: CommentView[]; error: string | null }> {
  const { data, error } = await supabase
    .from("post_comments")
    .select("*, author:profiles!author_id(id, full_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  type Row = {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author: { id: string; full_name: string | null; avatar_url: string | null } | null;
  };

  return {
    data: ((data || []) as Row[]).map((row) => ({
      id: row.id,
      targetId: row.post_id,
      postId: row.post_id,
      authorId: row.author_id,
      authorName: row.author?.full_name || "Usmanian",
      authorAvatar: row.author?.avatar_url || DEFAULT_AVATAR,
      content: row.content,
      createdAt: row.created_at,
      timestamp: formatRelativeTime(row.created_at),
    })),
    error: null,
  };
}

export async function addComment(input: {
  postId: string;
  authorId: string;
  content: string;
}): Promise<{ data: CommentView | null; error: string | null }> {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      content: input.content.trim(),
    })
    .select("*, author:profiles!author_id(id, full_name, avatar_url)")
    .single();

  if (error) return { data: null, error: error.message };

  const row = data as {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author: { full_name: string | null; avatar_url: string | null } | null;
  };

  return {
    data: {
      id: row.id,
      targetId: row.post_id,
      postId: row.post_id,
      authorId: row.author_id,
      authorName: row.author?.full_name || "Usmanian",
      authorAvatar: row.author?.avatar_url || DEFAULT_AVATAR,
      content: row.content,
      createdAt: row.created_at,
      timestamp: formatRelativeTime(row.created_at),
    },
    error: null,
  };
}

export async function countPostsByAuthor(authorId: string): Promise<{ posts: number; notes: number }> {
  const [{ count: posts }, { count: notes }] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", authorId)
      .eq("type", "standard"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", authorId)
      .eq("type", "shared_notes"),
  ]);
  return { posts: posts || 0, notes: notes || 0 };
}
