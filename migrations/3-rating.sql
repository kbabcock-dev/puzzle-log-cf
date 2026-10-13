-- Run once in the Neon SQL Editor if your puzzles table already exists. Safe to repeat.
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5);
