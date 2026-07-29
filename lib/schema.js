// Shared SQLite schema. Imported by both the custom server (server.js)
// and the Next.js data layer (lib/db.ts) so both use identical tables.

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'participant',
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quizzes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id          INTEGER NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'Технологии',
  seconds_per_question INTEGER NOT NULL DEFAULT 20,
  created_at        INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id     INTEGER NOT NULL,
  text        TEXT NOT NULL,
  image_url   TEXT,
  allow_multiple INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS options (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  text        TEXT NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS games (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id      INTEGER,
  quiz_title   TEXT NOT NULL,
  host_id      INTEGER NOT NULL,
  code         TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'lobby',
  created_at   INTEGER NOT NULL,
  finished_at  INTEGER,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_players (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id   INTEGER NOT NULL,
  user_id   INTEGER NOT NULL,
  nickname  TEXT NOT NULL,
  score     INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (game_id, user_id)
);
`

module.exports = { SCHEMA }
