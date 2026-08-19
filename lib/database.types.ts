export type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          total_xp?: number;
        };
        Update: {
          email?: string | null;
          username?: string | null;
          avatar_url?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
