import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 })
  }

  const user = db
    .prepare("SELECT id, password_hash, role FROM users WHERE email = ?")
    .get(String(email).toLowerCase()) as { id: number; password_hash: string; role: string } | undefined

  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
  }

  const token = createSession(user.id)
  await setSessionCookie(token)
  return NextResponse.json({ ok: true, role: user.role })
}
