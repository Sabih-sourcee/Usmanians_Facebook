export type VerificationStatus = "pending" | "approved" | "rejected";
export type UserRole = "student" | "teacher" | "admin";
export type PostType = "standard" | "shared_notes";
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type TeacherReportStatus = "open" | "archived";
export type ShopCategory = "gamer_tech" | "educational";
export type RedemptionStatus = "pending" | "approved" | "fulfilled" | "rejected";
export type ExplainerVideoStatus = "pending" | "approved" | "rejected";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  class_name: string | null;
  campus: string | null;
  student_cid: string | null;
  role: UserRole | string;
  verification_status: VerificationStatus | string;
  bio: string | null;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostRow {
  id: string;
  author_id: string;
  type: PostType | string;
  content: string;
  image_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  subject: string | null;
  grade_level: string | null;
  topic_tag: string | null;
  note_campus: string | null;
  attestation_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostLikeRow {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface FriendshipRow {
  user_id: string;
  friend_id: string;
  status: FriendshipStatus | string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TeacherReportRow {
  id: string;
  reporter_id: string | null;
  is_anonymous: boolean;
  teacher_name: string;
  class_name: string | null;
  category: string | null;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherReportLikeRow {
  report_id: string;
  user_id: string;
  created_at: string;
}

export interface TeacherReportCommentRow {
  id: string;
  report_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface PrincipalCandidateRow {
  id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  class_name: string | null;
  created_at: string;
}

export interface PrincipalVoteRow {
  id: string;
  voter_id: string;
  candidate_id: string;
  created_at: string;
}

export interface PrincipalVoteResultRow {
  candidate_id: string;
  full_name: string;
  photo_url: string | null;
  vote_count: number;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
}

export interface UserPointsRow {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface PointTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export interface ShopItemRow {
  id: string;
  name: string;
  category: ShopCategory | string;
  point_cost: number;
  stock_count: number;
  is_funded: boolean;
  description: string | null;
  created_at: string;
}

export interface RedemptionRequestRow {
  id: string;
  user_id: string;
  shop_item_id: string;
  status: RedemptionStatus | string;
  created_at: string;
  updated_at: string;
}

export interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
}

export interface ReferralPrizeRow {
  id: string;
  rank_min: number;
  rank_max: number;
  title: string;
  description: string | null;
  is_funded: boolean;
  created_at: string;
}

export interface BannerRow {
  id: string;
  text: string;
  link_text: string | null;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExplainerVideoRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  status: ExplainerVideoStatus | string;
  points_awarded: number;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostVoteRow {
  post_id: string;
  user_id: string;
  vote: number;
  created_at: string;
}

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        ProfileRow,
        Partial<ProfileRow> & { id: string },
        Partial<ProfileRow>
      >;
      posts: TableDef<
        PostRow,
        Partial<PostRow> & { author_id: string; content?: string },
        Partial<PostRow>
      >;
      post_likes: TableDef<
        PostLikeRow,
        { post_id: string; user_id: string; created_at?: string },
        Partial<PostLikeRow>
      >;
      post_comments: TableDef<
        PostCommentRow,
        { post_id: string; author_id: string; content: string; id?: string; created_at?: string },
        Partial<PostCommentRow>
      >;
      friendships: TableDef<
        FriendshipRow,
        { user_id: string; friend_id: string; status?: string; created_at?: string },
        Partial<FriendshipRow>
      >;
      notifications: TableDef<
        NotificationRow,
        Partial<NotificationRow> & { user_id: string; type: string },
        Partial<NotificationRow>
      >;
      teacher_reports: TableDef<
        TeacherReportRow,
        {
          teacher_name: string;
          description: string;
          reporter_id?: string | null;
          is_anonymous?: boolean;
          class_name?: string | null;
          category?: string | null;
        },
        Partial<TeacherReportRow>
      >;
      teacher_report_likes: TableDef<
        TeacherReportLikeRow,
        { report_id: string; user_id: string; created_at?: string },
        Partial<TeacherReportLikeRow>
      >;
      teacher_report_comments: TableDef<
        TeacherReportCommentRow,
        {
          report_id: string;
          author_id: string;
          content: string;
          id?: string;
          created_at?: string;
        },
        Partial<TeacherReportCommentRow>
      >;
      principal_candidates: TableDef<
        PrincipalCandidateRow,
        Partial<PrincipalCandidateRow> & { full_name: string },
        Partial<PrincipalCandidateRow>
      >;
      principal_votes: TableDef<
        PrincipalVoteRow,
        { voter_id: string; candidate_id: string; id?: string; created_at?: string },
        Partial<PrincipalVoteRow>
      >;
      push_subscriptions: TableDef<
        PushSubscriptionRow,
        {
          user_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent?: string | null;
          id?: string;
          created_at?: string;
        },
        Partial<PushSubscriptionRow>
      >;
    };
    Views: {
      principal_vote_results: {
        Row: PrincipalVoteResultRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
