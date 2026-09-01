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
  pointsBalance?: number;
  referralCode?: string | null;
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
  createdAt?: string;
  subject?: string | null;
  gradeLevel?: string | null;
  topicTag?: string | null;
  noteCampus?: string | null;
  attestationAccepted?: boolean;
  userVote?: -1 | 0 | 1;
  score?: number;
}

export type FeedItem = { kind: "post"; createdAt: string; post: PostView };

/** @deprecated Teacher reports are archived and hidden from all UI surfaces */
export interface TeacherReportView {
  id: string;
  teacherName: string;
  className: string | null;
  category: string | null;
  description: string;
  isAnonymous: boolean;
  reporterId: string | null;
  reporter: { name: string; avatar: string; timestamp: string };
  likes: number;
  comments: number;
  liked?: boolean;
  createdAt: string;
}

export interface CommentView {
  id: string;
  targetId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  timestamp: string;
  postId?: string;
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

export interface BannerView {
  id: string;
  text: string;
  linkText: string | null;
  linkUrl: string | null;
  isActive: boolean;
}

export interface ShopItemView {
  id: string;
  name: string;
  category: "gamer_tech" | "educational";
  pointCost: number;
  stockCount: number;
  isFunded: boolean;
  description: string | null;
}

export interface RedemptionRequestView {
  id: string;
  userId: string;
  userName: string;
  shopItemId: string;
  shopItemName: string;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  createdAt: string;
}

export interface ReferralLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  referralCount: number;
}

export interface ReferralSignupView {
  id: string;
  referredUserId: string;
  name: string;
  className: string | null;
  campus: string | null;
  signedUpAt: string;
  verificationStatus: string;
}

export interface ReferralPrizeView {
  id: string;
  rankMin: number;
  rankMax: number;
  title: string;
  description: string | null;
  isFunded: boolean;
}

export interface ExplainerVideoView {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  status: "pending" | "approved" | "rejected";
  pointsAwarded: number;
  createdAt: string;
}

export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect fill='%23E5E5E0' width='80' height='80'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%236B6B6B'/%3E%3Cpath fill='%236B6B6B' d='M12 70c0-15.5 12.5-28 28-28s28 12.5 28 28'/%3E%3C/svg%3E";

export const DEFAULT_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%230B6E3D'/%3E%3Cstop offset='1' stop-color='%23084D2A'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='240'/%3E%3C/svg%3E";
