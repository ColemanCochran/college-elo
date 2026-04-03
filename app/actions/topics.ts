"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAdmin(email: string | undefined): boolean {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes((email ?? "").toLowerCase());
}

export async function createTopic(data: {
  name: string;
  description: string;
  items: string[];
}): Promise<{ error: string } | void> {
  const user = await requireAuth();
  if (!isAdmin(user.email)) return { error: "Forum creation is currently by invite only." };
  const admin = createAdminClient();

  const name = data.name.trim();
  const description = data.description.trim();
  const items = data.items.map(s => s.trim()).filter(Boolean);

  if (!name) return { error: "Forum name is required." };
  if (items.length < 3) return { error: "Add at least 3 items." };

  const topicSlug = slugify(name);
  if (!topicSlug) return { error: "Forum name produces an invalid URL slug." };

  // Check slug uniqueness
  const { data: existing } = await admin
    .from("topics")
    .select("id")
    .eq("slug", topicSlug)
    .maybeSingle();

  if (existing) return { error: "A forum with this name already exists. Try a different name." };

  // Create the topic
  const { data: topic, error: topicError } = await admin
    .from("topics")
    .insert({
      name,
      slug: topicSlug,
      description: description || null,
      owner_id: user.id,
      is_public: true,
      is_system: false,
      leaderboard_unlock_votes: 10,
    })
    .select("id, slug")
    .single();

  if (topicError || !topic) return { error: "Failed to create topic. Please try again." };

  // Create items with deduplicated slugs
  const usedSlugs = new Set<string>();
  const itemRows = items.map((itemName) => {
    let base = slugify(itemName) || "item";
    let candidate = base;
    let i = 2;
    while (usedSlugs.has(candidate)) candidate = `${base}-${i++}`;
    usedSlugs.add(candidate);
    return { topic_id: topic.id, name: itemName, slug: candidate, elo_rating: 1500 };
  });

  const { error: itemsError } = await admin.from("topic_items").insert(itemRows);

  if (itemsError) {
    await admin.from("topics").delete().eq("id", topic.id);
    return { error: "Failed to save items. Please try again." };
  }

  redirect(`/topic/${topic.slug}`);
}

export async function updateTopic(
  topicId: string,
  data: { name: string; description: string; items: string[] }
): Promise<{ error: string } | void> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data: topic } = await admin
    .from("topics")
    .select("id, slug, owner_id, is_system")
    .eq("id", topicId)
    .single();

  if (!topic || topic.is_system) return { error: "Forum not found." };
  if (topic.owner_id !== user.id) return { error: "You don't have permission to edit this forum." };

  const name = data.name.trim();
  const description = data.description.trim();
  const items = data.items.map(s => s.trim()).filter(Boolean);

  if (!name) return { error: "Forum name is required." };
  if (items.length < 3) return { error: "Add at least 3 items." };

  const { error: updateError } = await admin
    .from("topics")
    .update({ name, description: description || null })
    .eq("id", topicId);

  if (updateError) return { error: "Failed to update forum." };

  // Diff items: keep existing by name, add new, delete removed
  const { data: existingItems } = await admin
    .from("topic_items")
    .select("id, name, slug")
    .eq("topic_id", topicId);

  const existing = existingItems ?? [];
  const existingNames = new Set(existing.map(i => i.name));
  const newNames = new Set(items);

  const toAdd = items.filter(n => !existingNames.has(n));
  const toRemove = existing.filter(i => !newNames.has(i.name));

  if (toAdd.length > 0) {
    const usedSlugs = new Set(existing.map(i => i.slug));
    const newRows = toAdd.map(itemName => {
      let base = slugify(itemName) || "item";
      let candidate = base;
      let idx = 2;
      while (usedSlugs.has(candidate)) candidate = `${base}-${idx++}`;
      usedSlugs.add(candidate);
      return { topic_id: topicId, name: itemName, slug: candidate, elo_rating: 1500 };
    });
    await admin.from("topic_items").insert(newRows);
  }

  if (toRemove.length > 0) {
    await admin.from("topic_items").delete().in("id", toRemove.map(i => i.id));
  }

  redirect(`/topic/${topic.slug}`);
}
