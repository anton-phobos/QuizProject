const { createServer } = require("http")
const next = require("next")
const { Server } = require("socket.io")
const path = require("path")
const Database = require("better-sqlite3")
const { SCHEMA } = require("./lib/schema.js")

const dev = process.env.NODE_ENV !== "production"
const port = parseInt(process.env.PORT || "3000", 10)
const app = next({ dev })
const handle = app.getRequestHandler()

// ---- Database (own connection to the same file the Next side uses) ----
const db = new Database(path.join(process.cwd(), "quiz.db"))
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")
db.exec(SCHEMA)

const BASE_POINTS = 1000

// ---- In-memory live game state, keyed by room code ----
/** @type {Map<string, any>} */
const liveGames = new Map()

function userFromCookie(cookieHeader) {
  if (!cookieHeader) return null
  const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("quiz_session="))
  if (!match) return null
  const token = decodeURIComponent(match.slice("quiz_session=".length))
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token)
  return row || null
}

function loadGame(code) {
  if (liveGames.has(code)) return liveGames.get(code)
  const game = db.prepare("SELECT * FROM games WHERE code = ?").get(code)
  if (!game) return null
  const questions = db
    .prepare("SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index, id")
    .all(game.quiz_id)
    .map((q) => ({
      id: q.id,
      text: q.text,
      image_url: q.image_url,
      allow_multiple: !!q.allow_multiple,
      options: db
        .prepare("SELECT id, text, is_correct FROM options WHERE question_id = ? ORDER BY order_index, id")
        .all(q.id),
    }))
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(game.quiz_id)
  const state = {
    id: game.id,
    code,
    quizId: game.quiz_id,
    hostId: game.host_id,
    title: quiz ? quiz.title : "Quiz",
    seconds: quiz ? quiz.seconds_per_question : 20,
    questions,
    status: "lobby", // lobby | question | reveal | over
    currentIndex: -1,
    endsAt: 0,
    timer: null,
    players: new Map(), // userId -> {userId, nickname, score, answered}
    answers: new Map(), // userId -> {optionId, points, correct}
    hostSocketId: null,
  }
  liveGames.set(code, state)
  return state
}

function publicPlayers(state) {
  return [...state.players.values()]
    .map((p) => ({ userId: p.userId, nickname: p.nickname, score: p.score }))
    .sort((a, b) => b.score - a.score)
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res))
  const io = new Server(server)

  io.use((socket, nextFn) => {
    socket.data.user = userFromCookie(socket.handshake.headers.cookie)
    nextFn()
  })

  io.on("connection", (socket) => {
    const user = socket.data.user

    // ---------- HOST ----------
    socket.on("host:join", ({ code }) => {
      const state = loadGame(code)
      if (!state) return socket.emit("error:msg", "Игра не найдена")
      if (!user || user.id !== state.hostId) return socket.emit("error:msg", "Нет доступа")
      socket.join(code)
      state.hostSocketId = socket.id
      socket.data.code = code
      socket.data.isHost = true
      socket.emit("host:ready", { title: state.title, total: state.questions.length })
      io.to(code).emit("lobby:update", { players: publicPlayers(state) })
    })

    socket.on("host:next", () => {
      const state = liveGames.get(socket.data.code)
      if (!state || !socket.data.isHost) return
      advance(io, state)
    })

    socket.on("host:cancel", () => {
      const state = liveGames.get(socket.data.code)
      if (!state || !socket.data.isHost) return
      if (state.timer) clearTimeout(state.timer)
      io.to(state.code).emit("game:cancelled")
      liveGames.delete(state.code)
      socket.leave(state.code)
      socket.disconnect(true)
    })

    // ---------- PLAYER ----------
    socket.on("player:join", ({ code }) => {
      const state = loadGame(code)
      console.log("PLAYER JOIN");
      console.log(user);
      if (!state) return socket.emit("error:msg", "Комната не найдена")
      if (!user) return socket.emit("error:msg", "Требуется вход в аккаунт")
      if (state.status === "over") return socket.emit("error:msg", "Игра уже завершена")

      socket.join(code)
      socket.data.code = code
      if (!state.players.has(user.id)) {
        state.players.set(user.id, { userId: user.id, nickname: user.name, score: 0, answered: false })
        db.prepare(
          "INSERT OR IGNORE INTO game_players (game_id, user_id, nickname, score) VALUES (?, ?, ?, 0)",
        ).run(state.id, user.id, user.name)
      }
      socket.emit("player:joined", { title: state.title, status: state.status })
      io.to(code).emit("lobby:update", { players: publicPlayers(state) })

      // If a question is already live, sync the joiner in.
      if (state.status === "question") sendQuestion(socket, state)
    })

    socket.on("player:answer", ({ optionId, optionIds }) => {
      const state = liveGames.get(socket.data.code)
      if (!state || state.status !== "question" || !user) return
      const player = state.players.get(user.id)
      if (!player || state.answers.has(user.id)) return

      const q = state.questions[state.currentIndex]
      const selectedIds = Array.isArray(optionIds)
        ? optionIds
        : optionId != null
          ? [optionId]
          : []
      const correctIds = q.options
        .filter((o) => o.is_correct)
        .map((o) => o.id)
      const correct =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id))
      const elapsed = Date.now() - (state.endsAt - state.seconds * 1000)
      const frac = Math.min(1, Math.max(0, elapsed / (state.seconds * 1000)))
      const points = correct ? Math.round(BASE_POINTS * (1 - 0.5 * frac)) : 0

      player.score += points
      player.answered = true
      state.answers.set(user.id, { optionIds: selectedIds, points, correct })
      socket.emit("answer:ack", { optionIds: selectedIds })

      io.to(state.code).emit("question:progress", {
        answered: state.answers.size,
        total: state.players.size,
      })
      // End early if everyone answered.
      if (state.answers.size >= state.players.size && state.players.size > 0) {
        endQuestion(io, state)
      }
    })

    socket.on("disconnect", () => {
      const state = liveGames.get(socket.data.code)
      if (!state) return
      if (socket.data.isHost) state.hostSocketId = null
    })
  })

  function sendQuestion(target, state) {
    const q = state.questions[state.currentIndex]
    target.emit("question:show", {
      index: state.currentIndex,
      total: state.questions.length,
      text: q.text,
      image_url: q.image_url,
      allow_multiple: q.allow_multiple,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
      seconds: state.seconds,
      endsAt: state.endsAt,
    })
  }

  function advance(io, state) {
    // From lobby or reveal -> next question. If no more questions -> finish.
    if (state.currentIndex + 1 >= state.questions.length) {
      return finishGame(io, state)
    }
    state.currentIndex += 1
    state.status = "question"
    state.answers = new Map()
    state.players.forEach((p) => (p.answered = false))
    state.endsAt = Date.now() + state.seconds * 1000
    io.to(state.code).emit("question:show", {
      index: state.currentIndex,
      total: state.questions.length,
      text: state.questions[state.currentIndex].text,
      image_url: state.questions[state.currentIndex].image_url,
      allow_multiple: state.questions[state.currentIndex].allow_multiple,
      options: state.questions[state.currentIndex].options.map((o) => ({ id: o.id, text: o.text })),
      seconds: state.seconds,
      endsAt: state.endsAt,
    })
    if (state.timer) clearTimeout(state.timer)
    state.timer = setTimeout(() => endQuestion(io, state), state.seconds * 1000 + 300)
  }

  function endQuestion(io, state) {
    if (state.status !== "question") return
    if (state.timer) clearTimeout(state.timer)
    state.timer = null
    state.status = "reveal"
    const q = state.questions[state.currentIndex]
    const correctOptionIds = q.options
      .filter((o) => o.is_correct)
      .map((o) => o.id)
    io.to(state.code).emit("question:reveal", {
      correctOptionIds,
      leaderboard: publicPlayers(state),
      isLast: state.currentIndex + 1 >= state.questions.length,
    })
  }

  function finishGame(io, state) {
    state.status = "over"
    if (state.timer) clearTimeout(state.timer)
    const save = db.transaction(() => {
      state.players.forEach((p) => {
        db.prepare("UPDATE game_players SET score = ? WHERE game_id = ? AND user_id = ?").run(
          p.score,
          state.id,
          p.userId,
        )
      })
      db.prepare("UPDATE games SET status = 'finished', finished_at = ? WHERE id = ?").run(
        Date.now(),
        state.id,
      )
    })
    save()
    io.to(state.code).emit("game:over", { leaderboard: publicPlayers(state) })
  }

  function cancelGame(io, state) {
    if (state.timer) {
      clearTimeout(state.timer)
    }

    io.to(state.code).emit("game:cancelled")

    db.prepare(
      "DELETE FROM games WHERE id = ?"
    ).run(state.id)

    liveGames.delete(state.code)
  }

  server.listen(port, () => {
    console.log(`Quiz server ready on http://localhost:${port}`)
  })
})
