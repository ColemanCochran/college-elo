-- ── Migration 016: Atomic vote procedures ────────────────────────────────────
--
-- Replaces the multi-step read-compute-write pattern in vote.ts with single
-- atomic stored procedures. This eliminates race conditions where concurrent
-- votes for the same pair could overwrite each other's ELO updates.
--
-- Two procedures:
--   1. submit_system_vote   — for college (is_system=true) topics
--   2. submit_topic_vote    — for user forum (is_system=false) topics
--
-- Each procedure:
--   - Reads current ratings with FOR UPDATE (row lock)
--   - Computes new ELO ratings in Postgres
--   - Updates ratings, wins/losses/comparisons atomically
--   - Inserts the vote record
--   - Updates matchup stats
--   - All within a single transaction (implicit in PL/pgSQL)

-- ── 1. Atomic vote for system (college) forums ──────────────────────────────

create or replace function submit_system_vote(
  p_winner_id    uuid,
  p_loser_id     uuid,
  p_topic_id     uuid,
  p_ip_hash      text,
  p_session_id   text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_rating  integer;
  v_loser_rating   integer;
  v_winner_wins    integer;
  v_winner_mp      integer;
  v_loser_losses   integer;
  v_loser_mp       integer;
  v_expected_w     double precision;
  v_winner_new     integer;
  v_loser_new      integer;
  v_canon_a        uuid;
  v_canon_b        uuid;
begin
  -- Lock and read winner rating
  select rating, wins, matches_played
    into v_winner_rating, v_winner_wins, v_winner_mp
    from elo_ratings
    where college_id = p_winner_id and topic_id = p_topic_id
    for update;

  -- Lock and read loser rating
  select rating, losses, matches_played
    into v_loser_rating, v_loser_losses, v_loser_mp
    from elo_ratings
    where college_id = p_loser_id and topic_id = p_topic_id
    for update;

  -- Calculate ELO (K=32)
  v_expected_w := 1.0 / (1.0 + power(10.0, (v_loser_rating - v_winner_rating)::double precision / 400.0));
  v_winner_new := round(v_winner_rating + 32 * (1.0 - v_expected_w));
  v_loser_new  := round(v_loser_rating  + 32 * (0.0 - (1.0 - v_expected_w)));

  -- Update ratings
  update elo_ratings
    set rating = v_winner_new, wins = v_winner_wins + 1, matches_played = v_winner_mp + 1
    where college_id = p_winner_id and topic_id = p_topic_id;

  update elo_ratings
    set rating = v_loser_new, losses = v_loser_losses + 1, matches_played = v_loser_mp + 1
    where college_id = p_loser_id and topic_id = p_topic_id;

  -- Insert vote record
  insert into votes (winner_college_id, loser_college_id, ip_hash, session_id, topic_id)
    values (p_winner_id, p_loser_id, p_ip_hash, p_session_id, p_topic_id);

  -- Update matchup stats (canonical order)
  v_canon_a := least(p_winner_id, p_loser_id);
  v_canon_b := greatest(p_winner_id, p_loser_id);
  perform record_matchup_vote(v_canon_a, v_canon_b, p_winner_id);
end;
$$;

-- ── 2. Atomic vote for user forum (topic_items) ─────────────────────────────

create or replace function submit_topic_item_vote(
  p_winner_id    uuid,
  p_loser_id     uuid,
  p_topic_id     uuid,
  p_ip_hash      text,
  p_session_id   text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_elo     integer;
  v_winner_wins    integer;
  v_winner_comp    integer;
  v_loser_elo      integer;
  v_loser_losses   integer;
  v_loser_comp     integer;
  v_expected_w     double precision;
  v_winner_new     integer;
  v_loser_new      integer;
  v_canon_a        uuid;
  v_canon_b        uuid;
begin
  -- Lock and read winner
  select elo_rating, wins, comparisons
    into v_winner_elo, v_winner_wins, v_winner_comp
    from topic_items
    where id = p_winner_id and topic_id = p_topic_id
    for update;

  -- Lock and read loser
  select elo_rating, losses, comparisons
    into v_loser_elo, v_loser_losses, v_loser_comp
    from topic_items
    where id = p_loser_id and topic_id = p_topic_id
    for update;

  -- Calculate ELO (K=32)
  v_expected_w := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::double precision / 400.0));
  v_winner_new := round(v_winner_elo + 32 * (1.0 - v_expected_w));
  v_loser_new  := round(v_loser_elo  + 32 * (0.0 - (1.0 - v_expected_w)));

  -- Update items
  update topic_items
    set elo_rating = v_winner_new, wins = v_winner_wins + 1, comparisons = v_winner_comp + 1,
        updated_at = now()
    where id = p_winner_id;

  update topic_items
    set elo_rating = v_loser_new, losses = v_loser_losses + 1, comparisons = v_loser_comp + 1,
        updated_at = now()
    where id = p_loser_id;

  -- Insert vote record
  insert into topic_votes (topic_id, winner_item_id, loser_item_id, ip_hash, session_id)
    values (p_topic_id, p_winner_id, p_loser_id, p_ip_hash, p_session_id);

  -- Update matchup stats (canonical order)
  v_canon_a := least(p_winner_id, p_loser_id);
  v_canon_b := greatest(p_winner_id, p_loser_id);
  perform record_topic_item_vote(p_topic_id, v_canon_a, v_canon_b, p_winner_id);
end;
$$;
