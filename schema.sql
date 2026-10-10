CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS puzzles (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  name       TEXT NOT NULL,
  artist     TEXT,
  pieces     INTEGER NOT NULL CHECK (pieces > 0),
  missing_pieces INTEGER NOT NULL DEFAULT 0 CHECK (missing_pieces >= 0),
  photo      TEXT,          -- base64 image data
  photo_type TEXT,          -- e.g. image/jpeg
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Already have a puzzles table without artist/missing_pieces? Run migrations/2-artist-and-missing-pieces.sql.
-- If you already created the puzzles table from the earliest version, also run:
-- ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
-- Old rows have no owner and will not show up. After creating your account you can claim them:
-- UPDATE puzzles SET user_id = (SELECT id FROM users WHERE username = 'your-username') WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS puzzles_user_idx ON puzzles (user_id, date DESC);
