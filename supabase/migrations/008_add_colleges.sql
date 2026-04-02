-- Add 17 new colleges
-- Run in Supabase Dashboard > SQL Editor

insert into colleges (name, slug, logo_url, elo_rating, comparisons, wins, losses) values
  ('California Institute of Technology', 'caltech',           'https://upload.wikimedia.org/wikipedia/en/a/a4/Caltech_Beavers_logo.svg',                        1500, 0, 0, 0),
  ('Boston College',                     'boston-college',    'https://upload.wikimedia.org/wikipedia/en/0/07/Boston_College_Eagles_logo.svg',                    1500, 0, 0, 0),
  ('University of Maryland',             'umd',               'https://upload.wikimedia.org/wikipedia/en/3/3e/Maryland_Terrapins_logo.svg',                       1500, 0, 0, 0),
  ('Texas A&M University',               'texas-am',          'https://upload.wikimedia.org/wikipedia/en/3/3a/Texas_A%26M_Aggies_logo.svg',                       1500, 0, 0, 0),
  ('Baylor University',                  'baylor',            'https://upload.wikimedia.org/wikipedia/en/2/24/Baylor_Bears_logo.svg',                             1500, 0, 0, 0),
  ('New York University',                'nyu',               'https://upload.wikimedia.org/wikipedia/en/8/8d/New_York_University_Athletics_logo.svg',             1500, 0, 0, 0),
  ('Williams College',                   'williams',          'https://upload.wikimedia.org/wikipedia/en/5/56/Williams_Ephs_logo.svg',                            1500, 0, 0, 0),
  ('Amherst College',                    'amherst',           'https://upload.wikimedia.org/wikipedia/en/0/0e/Amherst_Mammoths_logo.svg',                         1500, 0, 0, 0),
  ('Pomona College',                     'pomona',            'https://upload.wikimedia.org/wikipedia/en/4/42/Pomona-Pitzer_Sagehens_logo.svg',                   1500, 0, 0, 0),
  ('Bowdoin College',                    'bowdoin',           'https://upload.wikimedia.org/wikipedia/en/f/f3/Bowdoin_Polar_Bears_logo.svg',                      1500, 0, 0, 0),
  ('Harvey Mudd College',                'harvey-mudd',       'https://upload.wikimedia.org/wikipedia/en/4/47/Claremont-Mudd-Scripps_Stags_and_Athenas_logo.svg', 1500, 0, 0, 0),
  ('Claremont McKenna College',          'claremont-mckenna', 'https://upload.wikimedia.org/wikipedia/en/4/47/Claremont-Mudd-Scripps_Stags_and_Athenas_logo.svg', 1500, 0, 0, 0),
  ('University of California, Santa Barbara', 'ucsb',         'https://upload.wikimedia.org/wikipedia/en/c/c4/UCSB_Gauchos_logo.svg',                            1500, 0, 0, 0),
  ('University of California, Irvine',   'uci',               'https://upload.wikimedia.org/wikipedia/en/8/84/UC_Irvine_Anteaters_logo.svg',                     1500, 0, 0, 0),
  ('University of California, Santa Cruz','ucsc',             'https://upload.wikimedia.org/wikipedia/en/c/ca/UC_Santa_Cruz_Banana_Slugs_logo.svg',               1500, 0, 0, 0),
  ('Colorado School of Mines',           'colorado-mines',    'https://upload.wikimedia.org/wikipedia/en/3/3e/Colorado_School_of_Mines_Orediggers_logo.svg',      1500, 0, 0, 0),
  ('University of Colorado Boulder',     'cu-boulder',        'https://upload.wikimedia.org/wikipedia/en/4/4f/Colorado_Buffaloes_logo.svg',                       1500, 0, 0, 0)
on conflict (slug) do nothing;

-- Seed elo_ratings for all topics for the new colleges (starting at 1500)
insert into elo_ratings (college_id, topic_id, rating, wins, losses, matches_played)
select c.id, t.id, 1500, 0, 0, 0
from colleges c
cross join topics t
where c.slug in (
  'caltech', 'boston-college', 'umd', 'texas-am', 'baylor', 'nyu',
  'williams', 'amherst', 'pomona', 'bowdoin', 'harvey-mudd',
  'claremont-mckenna', 'ucsb', 'uci', 'ucsc', 'colorado-mines', 'cu-boulder'
)
on conflict (college_id, topic_id) do nothing;
