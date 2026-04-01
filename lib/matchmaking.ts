import { College, Matchup } from "@/types";

/**
 * Generate a matchup from a pool of colleges.
 *
 * Strategy:
 * - 70% of the time: pick the college with fewest comparisons, then find
 *   a similar-ELO opponent (within 200 points) to improve convergence.
 * - 30% of the time: random pairing for exploration.
 * - Never pair a college with itself.
 * - Avoid repeating the exact same pair as the previous matchup.
 */
export function generateMatchup(
  colleges: College[],
  previousMatchup?: Matchup | null
): Matchup | null {
  if (colleges.length < 2) return null;

  const sorted = [...colleges];
  const useSmartPairing = Math.random() < 0.7;

  let left: College;
  let right: College;

  if (useSmartPairing) {
    // Pick the college with fewest comparisons as the primary
    sorted.sort((a, b) => a.comparisons - b.comparisons);
    left = sorted[0];

    // Find candidates with similar ELO (within 300 points), excluding left
    const candidates = colleges
      .filter((c) => c.id !== left.id)
      .sort(
        (a, b) =>
          Math.abs(a.elo_rating - left.elo_rating) -
          Math.abs(b.elo_rating - left.elo_rating)
      );

    // Pick from top 5 similar-ELO candidates for some variety
    const pool = candidates.slice(0, Math.min(5, candidates.length));
    right = pool[Math.floor(Math.random() * pool.length)];
  } else {
    // Pure random pairing
    const shuffled = [...colleges].sort(() => Math.random() - 0.5);
    left = shuffled[0];
    right = shuffled[1];
  }

  // Avoid exact repeat of previous matchup
  if (previousMatchup) {
    const prevIds = new Set([
      previousMatchup.left.id,
      previousMatchup.right.id,
    ]);
    if (prevIds.has(left.id) && prevIds.has(right.id)) {
      // Try a different right
      const alternatives = colleges.filter(
        (c) => c.id !== left.id && !prevIds.has(c.id)
      );
      if (alternatives.length > 0) {
        right = alternatives[Math.floor(Math.random() * alternatives.length)];
      }
    }
  }

  // Randomly swap left/right so neither side is always "stronger"
  if (Math.random() < 0.5) {
    return { left, right };
  } else {
    return { left: right, right: left };
  }
}
