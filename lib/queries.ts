import { db } from "./db"

export interface QuizSummary {
  id: number
  title: string
  category: string
  seconds_per_question: number
  question_count: number
  created_at: number
}

export function getMyQuizzes(userId: number): QuizSummary[] {
  return db
    .prepare(
      `SELECT q.id, q.title, q.category, q.seconds_per_question, q.created_at,
              (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q WHERE q.owner_id = ? ORDER BY q.created_at DESC`,
    )
    .all(userId) as QuizSummary[]
}

export function getHostHistory(userId: number) {
  return db
    .prepare(
      `SELECT g.id, g.code, g.status, g.created_at, g.finished_at, COALESCE(g.quiz_title, 'Удаленный квиз') AS title,
              (SELECT COUNT(*) FROM game_players
                 WHERE game_id = g.id) as players
       FROM games g
       WHERE g.host_id = ?
       ORDER BY g.created_at DESC`
    )
    .all(userId) as {
      id: number
      code: string
      status: string
      created_at: number
      finished_at: number | null
      title: string
      players: number
    }[]
}

export function getPlayHistory(userId: number) {
  return db
    .prepare(
      `SELECT gp.score, g.id as game_id, g.status, g.finished_at, g.created_at, COALESCE(g.quiz_title, 'Удаленный квиз') AS title,
              (SELECT COUNT(*) + 1 FROM game_players gp2
                 WHERE gp2.game_id = g.id AND gp2.score > gp.score) as rank,
              (SELECT COUNT(*) FROM game_players WHERE game_id = g.id) as total
       FROM game_players gp
       JOIN games g ON g.id = gp.game_id
       WHERE gp.user_id = ?
       ORDER BY g.created_at DESC`,
    )
    .all(userId) as {
    score: number
    game_id: number
    status: string
    finished_at: number | null
    created_at: number
    title: string
    rank: number
    total: number
  }[]
}

export function getQuizForHost(quizId: number) {
  return db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId) as
    | { id: number; title: string; owner_id: number }
    | undefined
}

export function getGameByCode(code: string) {
  return db.prepare("SELECT * FROM games WHERE code = ?").get(code) as
    | { id: number; code: string; host_id: number; quiz_id: number; status: string }
    | undefined
}

export function getQuizWithQuestions(quizId: number) {
  const quiz = db
    .prepare(
      `SELECT id, owner_id, title, description, category, seconds_per_question
       FROM quizzes
       WHERE id = ?`
    )
    .get(quizId) as any

  if (!quiz) return null

  const questions = db
    .prepare(
      `SELECT id, text, image_url, allow_multiple
       FROM questions
       WHERE quiz_id = ?
       ORDER BY order_index`
    )
    .all(quizId) as any[]

  for (const question of questions) {
    question.allow_multiple = Boolean(question.allow_multiple)
    question.image_url = question.image_url ?? ""
    question.options = db
      .prepare(
        `SELECT id, text, is_correct
         FROM options
         WHERE question_id = ?
         ORDER BY order_index`
      )
      .all(question.id)
  }

  quiz.questions = questions

  return quiz
}
