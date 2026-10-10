-- Run once in the Neon SQL Editor if your puzzles table already exists. Safe to repeat.
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS artist TEXT;
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS missing_pieces INTEGER NOT NULL DEFAULT 0 CHECK (missing_pieces >= 0);
