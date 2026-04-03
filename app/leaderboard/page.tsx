import { redirect } from "next/navigation";

export default async function LegacyLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const slug = topic ?? "overall";
  redirect(`/topic/${slug}/leaderboard`);
}
