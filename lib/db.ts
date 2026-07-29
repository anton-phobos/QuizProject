import Database from "better-sqlite3"
import path from "path"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SCHEMA } = require("./schema.js")

// Single shared connection for the Next.js side. The custom server keeps its
// own connection to the same file (WAL mode makes concurrent access safe).
const DB_PATH = path.join(process.cwd(), "quiz.db")

declare global {
  // eslint-disable-next-line no-var
  var __quizDb: Database.Database | undefined
}

function createDb() {
  const db = new Database(DB_PATH)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")
  db.exec(SCHEMA)

  const columns = db.prepare("PRAGMA table_info(games)").all() as { name: string }[]

  if (!columns.some((c) => c.name === "quiz_title")) {
    db.prepare(`
      ALTER TABLE games
      ADD COLUMN quiz_title TEXT NOT NULL DEFAULT ''
    `).run()

    db.prepare(`
      UPDATE games
      SET quiz_title = (
        SELECT title
        FROM quizzes
        WHERE quizzes.id = games.quiz_id
      )
    `).run()
  }

  return db
}

export const db = global.__quizDb ?? createDb()
if (process.env.NODE_ENV !== "production") global.__quizDb = db

export type UserRole = "organizer" | "participant"

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  created_at: number
}
