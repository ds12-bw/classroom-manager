-- ============================================================
-- Migration: Make Score Categories Per-Class (Not System-Wide)
-- Phase 1: Database Schema Changes
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Clear existing data (safe for development database)
DELETE FROM scores;
DELETE FROM score_categories;

-- Step 2: Drop old FK constraint on scores table
-- Note: The constraint is auto-named by Postgres, using explicit constraint name
ALTER TABLE scores
DROP CONSTRAINT IF EXISTS scores_category_key_fkey;

-- Step 3: Drop old PK on scores table
ALTER TABLE scores
DROP CONSTRAINT IF EXISTS scores_pkey;

-- Step 4: Add class_id column to score_categories and update PK
ALTER TABLE score_categories
ADD COLUMN class_id text NOT NULL references classes(id) on delete cascade;

-- Step 5: Drop old PK on score_categories and create composite PK
ALTER TABLE score_categories
DROP CONSTRAINT IF EXISTS score_categories_pkey;

ALTER TABLE score_categories
ADD PRIMARY KEY (class_id, key);

-- Step 6: Add class_id column to scores table
ALTER TABLE scores
ADD COLUMN class_id text NOT NULL references classes(id) on delete cascade;

-- Step 7: Update scores table PK to include class_id
ALTER TABLE scores
ADD PRIMARY KEY (student_id, class_id, category_key);

-- Step 8: Add FK constraint on scores.category_key to reference composite key
-- Note: This creates a foreign key from (student_id, class_id, category_key)
--       to (class_id, key) in score_categories
ALTER TABLE scores
ADD CONSTRAINT scores_class_id_category_key_fkey
  FOREIGN KEY (class_id, category_key)
  REFERENCES score_categories(class_id, key)
  ON DELETE CASCADE;

-- ============================================================
-- Migration complete. Tables are now ready for per-class categories.
-- Next: Update store.js to use per-class category indexing
-- ============================================================
