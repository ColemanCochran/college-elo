export const ELO_DEFAULT = 1500;
export const ELO_K_FACTOR = 32;

/**
 * Minimum shape required to participate in ELO-based matchmaking.
 * Both the legacy College type and the new TopicItem type satisfy this.
 */
export interface RankableItem {
  id: string;
  elo_rating: number;
  comparisons: number;
}

/**
 * Calculate expected score for player A against player B.
 * Returns a value between 0 and 1.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a match.
 * @param winnerRating - Current ELO of the winner
 * @param loserRating - Current ELO of the loser
 * @returns New ratings for winner and loser
 */
export function calculateNewRatings(
  winnerRating: number,
  loserRating: number
): { winnerNew: number; loserNew: number } {
  const expectedWinner = expectedScore(winnerRating, loserRating);
  const expectedLoser = expectedScore(loserRating, winnerRating);

  const winnerNew = Math.round(winnerRating + ELO_K_FACTOR * (1 - expectedWinner));
  const loserNew = Math.round(loserRating + ELO_K_FACTOR * (0 - expectedLoser));

  return { winnerNew, loserNew };
}

/**
 * Calculate win rate as a percentage (0-100).
 */
export function calcWinRate(wins: number, comparisons: number): number {
  if (comparisons === 0) return 0;
  return Math.round((wins / comparisons) * 1000) / 10;
}
