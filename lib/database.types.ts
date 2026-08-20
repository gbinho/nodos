export type ProfileRow = {
  id: string;
  email: string | null;
  email_public: boolean;
  username: string | null;
  avatar_url: string | null;
  spotify_url: string | null;
  bg_gif_url: string | null;
  total_xp: number;
};

export type CheckinRow = {
  id: string;
  user_id: string | null;
  hobby_tag: string | null;
  description: string | null;
  image_url: string | null;
  time_invested_minutes: number;
  created_at: string;
};

export type ReactionRow = {
  id: string;
  checkin_id: string;
  user_id: string;
  reaction_type: "inspired" | "respect" | "fire";
};

export type CommentRow = {
  id: string;
  checkin_id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  edit_count: number;
};

export type CommentReactionRow = {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: "like";
};

export type CheckinVoteRow = {
  id: string;
  checkin_id: string;
  user_id: string;
  vote_type: "up" | "down";
};

export type BadgeRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_name: string;
  req_type: "checkins_count" | "total_hours" | "streak_days" | "total_xp";
  req_value: number;
};

export type UserBadgeRow = {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
};

export type FollowRow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email?: string | null;
          email_public?: boolean;
          username?: string | null;
          avatar_url?: string | null;
          spotify_url?: string | null;
          bg_gif_url?: string | null;
          total_xp?: number;
        };
        Update: {
          email?: string | null;
          email_public?: boolean;
          username?: string | null;
          avatar_url?: string | null;
          spotify_url?: string | null;
          bg_gif_url?: string | null;
          total_xp?: number;
        };
        Relationships: [];
      };
      checkins: {
        Row: CheckinRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          hobby_tag?: string | null;
          description?: string | null;
          image_url?: string | null;
          time_invested_minutes?: number;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          hobby_tag?: string | null;
          description?: string | null;
          image_url?: string | null;
          time_invested_minutes?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: ReactionRow;
        Insert: {
          id?: string;
          checkin_id: string;
          user_id: string;
          reaction_type: ReactionRow["reaction_type"];
        };
        Update: {
          checkin_id?: string;
          user_id?: string;
          reaction_type?: ReactionRow["reaction_type"];
        };
        Relationships: [];
      };
      comments: {
        Row: CommentRow;
        Insert: {
          id?: string;
          checkin_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          edited_at?: string | null;
          edit_count?: number;
        };
        Update: {
          checkin_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          edited_at?: string | null;
          edit_count?: number;
        };
        Relationships: [];
      };
      badges: {
        Row: BadgeRow;
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          icon_name: string;
          req_type: BadgeRow["req_type"];
          req_value: number;
        };
        Update: Partial<Omit<BadgeRow, "id">>;
        Relationships: [];
      };
      user_badges: {
        Row: UserBadgeRow;
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          unlocked_at?: string;
        };
        Update: {
          user_id?: string;
          badge_id?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: FollowRow;
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comment_reactions: {
        Row: CommentReactionRow;
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          reaction_type?: "like";
        };
        Update: {
          comment_id?: string;
          user_id?: string;
          reaction_type?: "like";
        };
        Relationships: [];
      };
      checkin_votes: {
        Row: CheckinVoteRow;
        Insert: {
          id?: string;
          checkin_id: string;
          user_id: string;
          vote_type: CheckinVoteRow["vote_type"];
        };
        Update: {
          checkin_id?: string;
          user_id?: string;
          vote_type?: CheckinVoteRow["vote_type"];
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
