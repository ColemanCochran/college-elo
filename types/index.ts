// ── Legacy college types (continue to power system topics) ───────────────────

export interface College {
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
}

export interface Vote {
  id: string;
  winner_college_id: string;
  loser_college_id: string;
  ip_hash: string | null;
  session_id: string | null;
  created_at: string;
}

export interface Matchup {
  left: College;
  right: College;
  token?: string;
}

export interface VoteResult {
  success: boolean;
  nextMatchup: Matchup | null;
  error?: string;
  voteCount?: number;
}

export interface LeaderboardEntry extends College {
  rank: number;
  win_rate: number;
}

export type SortField = "elo_rating" | "comparisons" | "win_rate" | "skip_rate";
export type SortDirection = "asc" | "desc";

// ── Generalized item types (power user-created topics) ────────────────────────

/**
 * Minimum shape required for ELO matchmaking.
 * Both College and TopicItem satisfy this interface.
 */
export interface RankableItem {
  id: string;
  elo_rating: number;
  comparisons: number;
}

/** A ranked item in a user-created topic. */
export interface TopicItem {
  id: string;
  topic_id: string;
  name: string;
  slug: string;
  /** Nullable; reserved for future image support — no upload logic in this phase */
  image_url: string | null;
  elo_rating: number;
  comparisons: number;
  wins: number;
  losses: number;
  skips: number;
  legacy_college_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicItemMatchup {
  left: TopicItem;
  right: TopicItem;
  token?: string;
}

export interface TopicItemVoteResult {
  success: boolean;
  nextMatchup: TopicItemMatchup | null;
  error?: string;
  voteCount?: number;
}

export interface TopicItemLeaderboardEntry extends TopicItem {
  rank: number;
  win_rate: number;
  skip_rate: number;
}

// ── User profile type ─────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
