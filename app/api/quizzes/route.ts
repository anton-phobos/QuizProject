import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  if (user.role !== "organizer") {
    return NextResponse.json({ error: "Только организатор может создавать квизы" }, { status: 403 })
  }

  const body = await req.json()
  const title = String(body.title || "").trim()
  const description = String(body.description || "").trim()
  const category = String(body.category || "Технологии")
  const seconds = Math.min(120, Math.max(5, Number(body.seconds_per_question) || 20))
  const questions = Array.isArray(body.questions) ? body.questions : []

  if (!title) return NextResponse.json({ error: "Введите название квиза" }, { status: 400 })
  if (questions.length === 0) {
    return NextResponse.json({ error: "Добавьте хотя бы один вопрос" }, { status: 400 })
  }

  for (const q of questions) {
    const opts = Array.isArray(q.options) ? q.options : []
    const filled = opts.filter((o: any) => String(o.text || "").trim())
    if (!String(q.text || "").trim()) {
      return NextResponse.json({ error: "У каждого вопроса должен быть текст" }, { status: 400 })
    }
    if (filled.length < 2) {
      return NextResponse.json({ error: "Минимум 2 варианта ответа в каждом вопросе" }, { status: 400 })
    }
    if (!opts.some((o: any) => o.is_correct && String(o.text || "").trim())) {
      return NextResponse.json({ error: "Отметьте правильный ответ в каждом вопросе" }, { status: 400 })
    }
  }

  const insert = db.transaction(() => {
    const quiz = db
      .prepare(
        "INSERT INTO quizzes (owner_id, title, description, category, seconds_per_question, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(user.id, title, description, category, seconds, Date.now())
    const quizId = Number(quiz.lastInsertRowid)

    questions.forEach((q: any, qi: number) => {
      const qRow = db
        .prepare("INSERT INTO questions (quiz_id, text, image_url, allow_multiple, order_index) VALUES (?,?,?,?,?)")
        .run(quizId, String(q.text).trim(), q.image_url ? String(q.image_url) : null, q.allow_multiple ? 1 : 0, qi)
      const qId = Number(qRow.lastInsertRowid)
      const opts = (q.options || []).filter((o: any) => String(o.text || "").trim())
      opts.forEach((o: any, oi: number) => {
        db.prepare(
          "INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)",
        ).run(qId, String(o.text).trim(), o.is_correct ? 1 : 0, oi)
      })
    })
    return quizId
  })

  const quizId = insert()
  return NextResponse.json({ ok: true, quizId })
}
