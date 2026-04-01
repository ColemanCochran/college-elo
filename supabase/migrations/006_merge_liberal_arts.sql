-- Consolidate Communications, Mathematics, Political Science, Psychology into Liberal Arts

-- Rename psychology to liberal-arts (reuses its elo_ratings rows)
UPDATE topics
SET slug        = 'liberal-arts',
    name        = 'Liberal Arts',
    description = 'Humanities, social sciences, and liberal arts programs'
WHERE slug = 'psychology';

-- Drop the other three (cascades to their elo_ratings rows)
DELETE FROM topics WHERE slug IN ('communications', 'mathematics', 'political-science');
