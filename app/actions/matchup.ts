"use server";

import { createClient } from "@/lib/supabase-server";

export interface MatchupStat {
  college_a_id: string;
  college_b_id: string;
  a_wins: number;
  b_wins: number;
  skips: number;
  appearances: number;
  college_a: { id: string; name: string; slug: string };
  college_b: { id: string; name: string; slug: string };
}

export async function getHeadToHead(
  idA: string,
  idB: string
): Promise<MatchupStat | null> {
  const supabase = await createClient();
  const [canonA, canonB] = idA < idB ? [idA, idB] : [idB, idA];

  const { data } = await supabase
    .from("matchup_stats")
    .select(`
      *,
      college_a:colleges!fk_matchup_a(id, name, slug),
      college_b:colleges!fk_matchup_b(id, name, slug)
    `)
    .eq("college_a_id", canonA)
    .eq("college_b_id", canonB)
    .maybeSingle();

  return data as MatchupStat | null;
}

export async function getTopMatchups(limit = 25): Promise<MatchupStat[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("matchup_stats")
    .select(`
      *,
      college_a:colleges!fk_matchup_a(id, name, slug),
      college_b:colleges!fk_matchup_b(id, name, slug)
    `)
    .order("appearances", { ascending: false })
    .limit(limit);

  return (data ?? []) as MatchupStat[];
}
