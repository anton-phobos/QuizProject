import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { quizId } = await req.json()
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(Number(quizId)) as
    | {
        id: number
        owner_id: number
        title: string
      }
    | undefined

  if (!quiz) return NextResponse.json({ error: "Квиз не найден" }, { status: 404 })
  if (quiz.owner_id !== user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  const count = db.prepare("SELECT COUNT(*) as c FROM questions WHERE quiz_id = ?").get(quiz.id) as {
    c: number
  }
  if (count.c === 0) {
    return NextResponse.json({ error: "В квизе нет вопросов" }, { status: 400 })
  }

  let code = generateCode()
  for (let i = 0; i < 5; i++) {
    const exists = db.prepare("SELECT id FROM games WHERE code = ? AND status != 'finished'").get(code)
    if (!exists) break
    code = generateCode()
  }

  const info = db
    .prepare(`
      INSERT INTO games
        (quiz_id, quiz_title, host_id, code, status, created_at)
      VALUES
        (?, ?, ?, ?, 'lobby', ?)
    `)
    .run(
      quiz.id,
      quiz.title,
      user.id,
      code,
      Date.now()
    )

  return NextResponse.json({ ok: true, code, gameId: Number(info.lastInsertRowid) })
}
