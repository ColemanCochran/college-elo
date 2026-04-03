"use server";

import { createAdminClient } from "@/lib/supabase-server";

export async function joinWaitlist(
  email: string
): Promise<{ error: string } | void> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("waitlist").insert({ email: trimmed });

  if (error) {
    if (error.code === "23505") {
      // unique_violation — already on the list
      return { error: "already_on_list" };
    }
    return { error: "Something went wrong. Please try again." };
  }
}
