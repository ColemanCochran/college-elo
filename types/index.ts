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
