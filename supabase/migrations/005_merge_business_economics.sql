-- Merge "business" and "economics" into a single "business-economics" topic.
-- Since topic-specific votes are new and minimal, we rename business and drop economics.

-- Rename the business topic
UPDATE topics
SET slug        = 'business-economics',
    name        = 'Business/Economics',
    description = 'Business, economics, and finance programs'
WHERE slug = 'business';

-- Remove economics (cascades to its elo_ratings rows)
DELETE FROM topics WHERE slug = 'economics';
