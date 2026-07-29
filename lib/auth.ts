import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { db, type User } from "./db"

const COOKIE = "quiz_session"

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash)
}

export function createSession(userId: number) {
  const token = randomBytes(24).toString("hex")
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    Date.now(),
  )
  return token
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearSession() {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token)
  store.delete(COOKIE)
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token) as User | undefined
  return row ?? null
}
