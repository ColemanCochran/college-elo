export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** null for system topics, set to the creating user's id for user topics */
  owner_id: string | null;
  is_public: boolean;
  /** true for built-in college topics; system topics cannot be mutated via API */
  is_system: boolean;
  /** number of votes a user must cast before the leaderboard unlocks */
  leaderboard_unlock_votes: number;
  created_at: string;
}

/** Topic row joined with item counts — used on the discovery/browse page */
export interface TopicSummary extends Topic {
  item_count: number;
  total_votes: number;
}

/** Topic row joined with its owner's profile — used on topic detail pages */
export interface TopicWithOwner extends Topic {
  owner: {
    id: string;
    username: string | null;
    display_name: string | null;
  } | null;
}
