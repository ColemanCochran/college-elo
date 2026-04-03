import crypto from "crypto";
import { cookies } from "next/headers";

/** Derives a fixed session token from the admin credentials stored in env vars. */
function computeToken(): string {
  const email = process.env.ADMIN_EMAIL ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  return crypto
    .createHash("sha256")
    .update(`${email}:${password}:duelist-admin`)
    .digest("hex");
}

/** Returns true if the current request carries a valid admin session cookie. */
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return false;
  const expected = computeToken();
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export { computeToken };
