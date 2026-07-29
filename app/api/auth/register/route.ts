import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth"

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 })
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 })
  }
  const finalRole = role === "organizer" ? "organizer" : "participant"

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(String(email).toLowerCase())
  if (existing) {
    return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 })
  }

  const info = db
    .prepare("INSERT INTO users (email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(String(email).toLowerCase(), String(name).trim(), hashPassword(String(password)), finalRole, Date.now())

  const token = createSession(Number(info.lastInsertRowid))
  await setSessionCookie(token)
  return NextResponse.json({ ok: true, role: finalRole })
}
