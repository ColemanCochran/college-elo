import { College, Matchup } from "@/types";
import { RankableItem } from "@/lib/elo";

/**
 * Generate a matchup from a pool of colleges.
 * Delegates to the generic generateMatchupFrom<College>.
 */
export function generateMatchup(
  colleges: College[],
  previousMatchup?: Matchup | null
): Matchup | null {
  const previousIds = previousMatchup
    ? ([previousMatchup.left.id, previousMatchup.right.id] as [string, string])
    : null;

  const result = generateMatchupFrom(colleges, previousIds);
  if (!result) return null;
  return result as Matchup;
}

/**
 * Generic matchup generator for any pool of RankableItem.
 * Works with College[], TopicItem[], or any type that extends RankableItem.
 *
 * Strategy:
 * - 70%: pick the item with fewest comparisons, pair with a similar-ELO
 *         opponent (closest within the top-5 candidates) to improve convergence.
 * - 30%: random pairing for exploration.
 * - Never pair an item with itself.
 * - Avoid repeating the exact same pair as the previous matchup.
 * - Randomly swap left/right to prevent side bias.
 */
export function generateMatchupFrom<T extends RankableItem>(
  items: T[],
  previousIds?: [string, string] | null
): { left: T; right: T } | null {
  if (items.length < 2) return null;

  const useSmartPairing = Math.random() < 0.7;

  let left: T;
  let right: T;

  if (useSmartPairing) {
    const sorted = [...items].sort((a, b) => a.comparisons - b.comparisons);
    left = sorted[0];

    const candidates = items
      .filter((c) => c.id !== left.id)
      .sort(
        (a, b) =>
          Math.abs(a.elo_rating - left.elo_rating) -
          Math.abs(b.elo_rating - left.elo_rating)
      );

    const pool = candidates.slice(0, Math.min(5, candidates.length));
    right = pool[Math.floor(Math.random() * pool.length)];
  } else {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    left = shuffled[0];
    right = shuffled[1];
  }

  // Avoid exact repeat
  if (previousIds) {
    const prevSet = new Set(previousIds);
    if (prevSet.has(left.id) && prevSet.has(right.id)) {
      const alternatives = items.filter(
        (c) => c.id !== left.id && !prevSet.has(c.id)
      );
      if (alternatives.length > 0) {
        right = alternatives[Math.floor(Math.random() * alternatives.length)];
      }
    }
  }

  if (Math.random() < 0.5) {
    return { left, right };
  } else {
    return { left: right, right: left };
  }
}
