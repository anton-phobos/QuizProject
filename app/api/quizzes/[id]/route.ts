import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { getQuizForHost } from "@/lib/queries"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { id } = await params

  const quiz = getQuizForHost(Number(id))

  if (!quiz || quiz.owner_id !== user.id) {
    return NextResponse.json({ error: "Квиз не найден" }, { status: 404 })
  }

  const body = await req.json()

  const title = String(body.title || "").trim()
  const description = String(body.description || "").trim()
  const category = String(body.category || "Технологии")
  const seconds = Number(body.seconds_per_question)
  const questions = body.questions ?? []

  db.transaction(() => {
    db.prepare(
      `
      UPDATE quizzes
      SET title=?, description=?, category=?, seconds_per_question=?
      WHERE id=?
    `
    ).run(title, description, category, seconds, quiz.id)

    db.prepare(
      `
      DELETE FROM options
      WHERE question_id IN (
        SELECT id FROM questions WHERE quiz_id=?
      )
    `
    ).run(quiz.id)

    db.prepare("DELETE FROM questions WHERE quiz_id=?").run(quiz.id)

    questions.forEach((q: any, qi: number) => {
      const result = db
        .prepare(
          `
          INSERT INTO questions
          (quiz_id,text,image_url,allow_multiple,order_index)
          VALUES (?,?,?,?,?)
        `
        )
        .run(
          quiz.id,
          q.text,
          q.image_url || null,
          q.allow_multiple ? 1 : 0,
          qi
        )

      const questionId = Number(result.lastInsertRowid)

      q.options.forEach((o: any, oi: number) => {
        db.prepare(
          `
          INSERT INTO options
          (question_id,text,is_correct,order_index)
          VALUES (?,?,?,?)
        `
        ).run(
          questionId,
          o.text,
          o.is_correct ? 1 : 0,
          oi
        )
      })
    })
  })()

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: "Не авторизован" },
      { status: 401 }
    )
  }

  const { id } = await params

  const quiz = getQuizForHost(Number(id))

  if (!quiz || quiz.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Квиз не найден" },
      { status: 404 }
    )
  }

  db.transaction(() => {
    db.prepare(
      `
      DELETE FROM options
      WHERE question_id IN (
        SELECT id
        FROM questions
        WHERE quiz_id = ?
      )
      `
    ).run(quiz.id)

    db.prepare(
      `
      DELETE FROM questions
      WHERE quiz_id = ?
      `
    ).run(quiz.id)

    db.prepare(
      `
      UPDATE games
      SET quiz_id = NULL
      WHERE quiz_id = ?
      `
    ).run(quiz.id)

    db.prepare(
      `
      DELETE FROM quizzes
      WHERE id = ?
      `
    ).run(quiz.id)
  })()

  return NextResponse.json({ ok: true })
}