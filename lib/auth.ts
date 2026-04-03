import { getUser } from "@/lib/supabase-server";

/**
 * Returns the authenticated user or throws an error.
 * Use in server actions that require authentication.
 *
 * @example
 * export async function createTopic(formData: FormData) {
 *   const user = await requireAuth();
 *   // user.id is guaranteed non-null here
 * }
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
