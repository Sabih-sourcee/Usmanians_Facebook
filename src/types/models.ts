export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  coverImage: string;
  badgeText: string;
  bio: string;
  stats: {
    posts: number;
    followers: number;
    notes: number;
  };
}

export interface PostAttachment {
  fileName: string;
  fileSize?: string;
  categories?: string[];
  imageUrl?: string;
  downloadUrl?: string;
}

export interface PostView {
  id: string;
  authorId: string;
  author: {
    name: string;
    avatar: string;
    timestamp: string;
  };
  content: string;
  categoryHeader?: string;
  type?: "standard" | "notes" | "academic" | "thought";
  attachment?: PostAttachment;
  tags?: string[];
  likes: number;
  comments: number;
  liked?: boolean;
  imageUrl?: string | null;
}

export interface CommentView {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  timestamp: string;
}

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  actorId: string | null;
  referenceId: string | null;
}

export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect fill='%23E5E5E0' width='80' height='80'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%236B6B6B'/%3E%3Cpath fill='%236B6B6B' d='M12 70c0-15.5 12.5-28 28-28s28 12.5 28 28'/%3E%3C/svg%3E";

export const DEFAULT_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%230B6E3D'/%3E%3Cstop offset='1' stop-color='%23084D2A'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='240'/%3E%3C/svg%3E";
