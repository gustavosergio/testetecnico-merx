CREATE TABLE trainers (
  name_key TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  session_hash TEXT UNIQUE NOT NULL,
  favorite_id INTEGER,
  favorite_name TEXT,
  CHECK ((favorite_id IS NULL) = (favorite_name IS NULL))
);
