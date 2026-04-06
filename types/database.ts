/**
 * Hand-written Supabase database types.
 * Run `supabase gen types typescript --local > types/database.ts` to regenerate
 * from a live instance and replace this file.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      colleges: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          elo_rating: number;
          comparisons: number;
          wins: number;
          losses: number;
          skips: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          elo_rating?: number;
          comparisons?: number;
          wins?: number;
          losses?: number;
          skips?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          elo_rating?: number;
          comparisons?: number;
          wins?: number;
          losses?: number;
          skips?: number;
          updated_at?: string;
        };
      };

      elo_ratings: {
        Row: {
          id: string;
          college_id: string;
          topic_id: string;
          rating: number;
          wins: number;
          losses: number;
          matches_played: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          college_id: string;
          topic_id: string;
          rating?: number;
          wins?: number;
          losses?: number;
          matches_played?: number;
          updated_at?: string;
        };
        Update: {
          rating?: number;
          wins?: number;
          losses?: number;
          matches_played?: number;
          updated_at?: string;
        };
      };

      matchup_stats: {
        Row: {
          id: string;
          college_a_id: string;
          college_b_id: string;
          a_wins: number;
          b_wins: number;
          skips: number;
          appearances: number;
        };
        Insert: {
          id?: string;
          college_a_id: string;
          college_b_id: string;
          a_wins?: number;
          b_wins?: number;
          skips?: number;
          appearances?: number;
        };
        Update: {
          a_wins?: number;
          b_wins?: number;
          skips?: number;
          appearances?: number;
        };
      };

      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };

      topics: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          owner_id: string | null;
          is_public: boolean;
          is_system: boolean;
          leaderboard_unlock_votes: number;
          topic_group: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          owner_id?: string | null;
          is_public?: boolean;
          is_system?: boolean;
          leaderboard_unlock_votes?: number;
          topic_group?: string | null;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          owner_id?: string | null;
          is_public?: boolean;
          leaderboard_unlock_votes?: number;
          topic_group?: string | null;
        };
      };

      topic_items: {
        Row: {
          id: string;
          topic_id: string;
          name: string;
          slug: string;
          image_url: string | null;
          elo_rating: number;
          comparisons: number;
          wins: number;
          losses: number;
          skips: number;
          legacy_college_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          name: string;
          slug: string;
          image_url?: string | null;
          elo_rating?: number;
          comparisons?: number;
          wins?: number;
          losses?: number;
          skips?: number;
          legacy_college_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          image_url?: string | null;
          elo_rating?: number;
          comparisons?: number;
          wins?: number;
          losses?: number;
          skips?: number;
          updated_at?: string;
        };
      };

      topic_votes: {
        Row: {
          id: string;
          topic_id: string;
          winner_item_id: string;
          loser_item_id: string;
          ip_hash: string | null;
          session_id: string | null;
          voter_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          winner_item_id: string;
          loser_item_id: string;
          ip_hash?: string | null;
          session_id?: string | null;
          voter_id?: string | null;
          created_at?: string;
        };
        Update: never;
      };

      topic_matchup_stats: {
        Row: {
          id: string;
          topic_id: string;
          item_a_id: string;
          item_b_id: string;
          a_wins: number;
          b_wins: number;
          skips: number;
          appearances: number;
        };
        Insert: {
          id?: string;
          topic_id: string;
          item_a_id: string;
          item_b_id: string;
          a_wins?: number;
          b_wins?: number;
          skips?: number;
          appearances?: number;
        };
        Update: {
          a_wins?: number;
          b_wins?: number;
          skips?: number;
          appearances?: number;
        };
      };

      votes: {
        Row: {
          id: string;
          winner_college_id: string;
          loser_college_id: string;
          ip_hash: string | null;
          session_id: string | null;
          topic_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          winner_college_id: string;
          loser_college_id: string;
          ip_hash?: string | null;
          session_id?: string | null;
          topic_id?: string | null;
          created_at?: string;
        };
        Update: never;
      };

      waitlist: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: never;
      };
    };

    Functions: {
      record_matchup_vote: {
        Args: {
          college_a_id: string;
          college_b_id: string;
          winner_id: string;
        };
        Returns: void;
      };
      record_matchup_skip: {
        Args: {
          college_a_id: string;
          college_b_id: string;
        };
        Returns: void;
      };
      record_topic_item_vote: {
        Args: {
          p_topic_id: string;
          p_item_a_id: string;
          p_item_b_id: string;
          p_winner_id: string;
        };
        Returns: void;
      };
      record_topic_item_skip: {
        Args: {
          p_topic_id: string;
          p_item_a_id: string;
          p_item_b_id: string;
        };
        Returns: void;
      };
    };
  };
}

/** Convenience type aliases */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
