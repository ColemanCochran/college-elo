import crypto from "crypto";

const SECRET = process.env.MATCHUP_TOKEN_SECRET!;
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function signMatchup(leftId: string, rightId: string): string {
  const ts = Date.now().toString();
  const payload = `${leftId}:${rightId}:${ts}`;
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 24);
  return `${payload}:${sig}`;
}

export function verifyMatchupToken(
  token: string,
  winnerId: string,
  loserId: string
): boolean {
  if (!SECRET) return false;

  const parts = token.split(":");
  if (parts.length !== 4) return false;
  const [leftId, rightId, tsStr, sig] = parts;

  // Winner and loser must be the two colleges in the matchup
  const validPair =
    (winnerId === leftId && loserId === rightId) ||
    (winnerId === rightId && loserId === leftId);
  if (!validPair) return false;

  // Token must not be expired
  const ts = parseInt(tsStr, 10);
  if (isNaN(ts) || Date.now() - ts > EXPIRY_MS) return false;

  // Signature must match
  const payload = `${leftId}:${rightId}:${tsStr}`;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 24);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}
