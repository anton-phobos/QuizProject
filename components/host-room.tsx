"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getSocket, ANSWER_STYLES } from "@/lib/socket-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Leaderboard } from "@/components/leaderboard"
import { Countdown } from "@/components/countdown"
import { Users, Play, ArrowRight, Trophy, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Player {
  userId: number
  nickname: string
  score: number
}
interface QuestionData {
  index: number
  total: number
  text: string
  image_url: string | null
  options: { id: number; text: string }[]
  seconds: number
  endsAt: number
}

type Phase = "lobby" | "question" | "reveal" | "over"

export function HostRoom({ code }: { code: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("lobby")
  const [title, setTitle] = useState("")
  const [total, setTotal] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [progress, setProgress] = useState({ answered: 0, total: 0 })
  const [reveal, setReveal] = useState<{ correctOptionId: number | null; isLast: boolean } | null>(null)
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [mounted, setMounted] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const socket = getSocket()
    socket.emit("host:join", { code })

    socket.on("host:ready", (d: { title: string; total: number }) => {
      setTitle(d.title)
      setTotal(d.total)
    })
    socket.on("lobby:update", (d: { players: Player[] }) => setPlayers(d.players))
    socket.on("question:show", (d: QuestionData) => {
      setQuestion(d)
      setReveal(null)
      setProgress({ answered: 0, total: players.length })
      setPhase("question")
    })
    socket.on("question:progress", (d) => setProgress(d))
    socket.on("question:reveal", (d) => {
      setReveal({ correctOptionId: d.correctOptionId, isLast: d.isLast })
      setLeaderboard(d.leaderboard)
      setPhase("reveal")
    })
    socket.on("game:over", (d: { leaderboard: Player[] }) => {
      setLeaderboard(d.leaderboard)
      setPhase("over")
    })
    socket.on("error:msg", (m: string) => alert(m))

    return () => {
      socket.off("host:ready")
      socket.off("lobby:update")
      socket.off("question:show")
      socket.off("question:progress")
      socket.off("question:reveal")
      socket.off("game:over")
      socket.off("error:msg")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  function next() {
    started.current = true
    getSocket().emit("host:next")
  }

  async function cancelGame() {
    await fetch(`/api/games/${code}`, {
      method: "DELETE",
    })

    getSocket().emit("host:cancel")

    router.refresh()
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
      {phase === "lobby" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Код комнаты
            </p>
            <div className="rounded-2xl bg-primary px-10 py-6 font-mono text-6xl font-bold tracking-widest text-primary-foreground">
              {code}
            </div>
            <p className="mt-3 text-muted-foreground">
              Сообщите этот код участникам для подключения
            </p>
          </div>

          <Card className="w-full max-w-md p-5">
            <div className="mb-3 flex items-center justify-center gap-2 font-semibold">
              <Users className="h-5 w-5" />
              Участники ({players.length})
            </div>
            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ожидаем подключения...</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((p) => (
                  <span
                    key={p.userId}
                    className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground"
                  >
                    {p.nickname}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between gap-3">
            <AlertDialog>
              <AlertDialogTrigger variant="destructive">
                Отменить игру
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Отменить игру?
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    Все подключенные участники будут отключены, а комната будет удалена.
                    Это действие нельзя будет отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>
                    Назад
                  </AlertDialogCancel>

                  <AlertDialogAction 
                    onClick={cancelGame}
                    variant="destructive"
                  >    
                    Да, отменить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={next}
              disabled={!mounted || players.length === 0}
            >
              <Play className="h-5 w-5" />
              Начать квиз
            </Button>
          </div>
        </div>
      )}

      {phase === "question" && question && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between rounded-xl border bg-card p-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Вопрос
              </p>
              <p className="text-lg font-bold">
                {question.index + 1} / {question.total}
              </p>
            </div>

            <div className="rounded-full bg-primary/10 px-4 py-2">
              <Countdown 
                endsAt={question.endsAt} 
                seconds={question.seconds} 
              />
            </div>
          </div>
          <Card className="flex flex-col gap-4 p-6 text-center">
            <h2 className="text-balance text-2xl font-bold leading-tight">
              {question.text}
            </h2>
            {question.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.image_url || "/placeholder.svg"}
                alt="Изображение к вопросу"
                className="mx-auto mt-4 max-h-64 rounded-md object-contain"
                crossOrigin="anonymous"
              />
            )}
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.options.map((o, i) => (
              <div
                key={o.id}
                className={`flex items-center justify-center text-center gap-3 rounded-xl p-4 text-lg font-semibold text-primary-foreground ${ANSWER_STYLES[i % 4].bg}`}
              >
                {o.text}
              </div>
            ))}
          </div>
          <div className="mt-auto text-center text-muted-foreground">
            Ответили: {progress.answered} из {players.length}
          </div>
        </div>
      )}

      {phase === "reveal" && (
        <div className="flex flex-1 flex-col gap-6">
          <h2 className="text-center text-2xl font-bold">Результаты вопроса</h2>
          <Leaderboard players={leaderboard} />
          <div className="mt-auto flex justify-center">
            <Button onClick={next}>
              {reveal?.isLast ? (
                <>
                  <Trophy className="h-5 w-5" />
                  Показать итоги
                </>
              ) : (
                <>
                  Следующий вопрос
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="flex flex-1 flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Trophy className="h-12 w-12 text-primary" />
            <h2 className="text-3xl font-bold">Квиз завершен!</h2>
            <p className="text-muted-foreground">{title}</p>
          </div>
          <Leaderboard players={leaderboard} podium />
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Вернуться в кабинет
          </Button>
        </div>
      )}
    </div>
  )
}
