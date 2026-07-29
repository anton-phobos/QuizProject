"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSocket, ANSWER_STYLES } from "@/lib/socket-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/countdown"
import { Leaderboard } from "@/components/leaderboard"
import { Check, X, Trophy, Loader2, AlertTriangle } from "lucide-react"
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

interface QuestionData {
  index: number
  total: number
  text: string
  image_url: string | null
  allow_multiple: boolean
  options: { id: number; text: string }[]
  seconds: number
  endsAt: number
}
interface Player {
  userId: number
  nickname: string
  score: number
}

type Phase = "connecting" | "lobby" | "question" | "answered" | "reveal" | "over"

export function PlayRoom({ code, nickname }: { code: string; nickname: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("connecting")
  const [title, setTitle] = useState("")
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [chosen, setChosen] = useState<number[]>([])
  const [reveal, setReveal] = useState<{ correctOptionIds: number[] } | null>(null)
  const [leaderboard, setLeaderboard] = useState<Player[]>([])
  const [error, setError] = useState<string | null>(null)
  const [gameCancelled, setGameCancelled] = useState(false)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    const socket = getSocket()
    socket.emit("player:join", { code })

    socket.on("player:joined", (d: { title: string; status: string }) => {
      setTitle(d.title)
      setPhase((p) => (p === "connecting" ? "lobby" : p))
    })
    socket.on("question:show", (d: QuestionData) => {
      setQuestion(d)
      setChosen([])
      setReveal(null)
      setAnswered(false)
      setPhase("question")
    })
    socket.on("answer:ack", (d: { optionIds: number[] }) => {
      setChosen(d.optionIds)
      setAnswered(true)
      setPhase("answered")
    })
    socket.on("question:reveal", (d: { correctOptionIds: number[]; leaderboard: Player[] }) => {
      setReveal({ correctOptionIds: d.correctOptionIds })
      setLeaderboard(d.leaderboard)
      setPhase("reveal")
    })
    socket.on("game:over", (d: { leaderboard: Player[] }) => {
      setLeaderboard(d.leaderboard)
      setPhase("over")
    })
    socket.on("game:cancelled", () => {
      setGameCancelled(true)

      setTimeout(() => {
        router.push("/join")
      }, 4000)
    })
    socket.on("error:msg", (m: string) => setError(m))

    return () => {
      socket.off("player:joined")
      socket.off("question:show")
      socket.off("answer:ack")
      socket.off("question:reveal")
      socket.off("game:over")
      socket.off("game:cancelled")
      socket.off("error:msg")
    }
  }, [code])

  function answer(optionId: number) {
    if (!question) return

    if (question.allow_multiple) {
      setChosen((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      if (chosen.length > 0) return

      setChosen([optionId])

      getSocket().emit("player:answer", {
        optionIds: [optionId],
      })
    }
  }

  const myScore = leaderboard.find((p) => p.nickname === nickname)?.score

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <X className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">{error}</p>
        <p className="max-w-sm text-sm text-muted-foreground">Сейчас вы будете автоматически возвращены на страницу подключения.</p>
        <Button variant="outline" onClick={() => router.push("/join")}>
          Назад
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
      {phase === "connecting" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          Подключение к комнате {code}...
        </div>
      )}

      {phase === "lobby" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-accent px-4 py-1 text-sm font-medium text-accent-foreground">
            {nickname}
          </div>
          <h1 className="text-balance text-2xl font-bold">Вы в игре!</h1>
          <p className="text-muted-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">Ждем, пока организатор начнет квиз...</p>
        </div>
      )}

      {(phase === "question" || phase === "answered") && question && (
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
                className="mx-auto mt-3 max-h-48 rounded-md object-contain"
              />
            )}
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.options.map((o, i) => {
              const isChosen = chosen.includes(o.id)
              const dimmed =
                !question.allow_multiple &&
                chosen.length > 0 &&
                !isChosen
              return (
                <button
                  key={o.id}
                  onClick={() => answer(o.id)}
                  disabled={!question.allow_multiple && chosen.length > 0}
                  className={`flex min-h-16 items-center justify-center gap-2 rounded-xl p-4 text-lg font-semibold text-primary-foreground transition ${ANSWER_STYLES[i % 4].bg} ${dimmed ? "opacity-40" : ""} ${isChosen ? "ring-4 ring-offset-2 " + ANSWER_STYLES[i % 4].ring : ""}`}
                >
                  {o.text}
                  {isChosen && <Check className="h-5 w-5" />}
                </button>
              )
            })}
          </div>

          {question.allow_multiple && phase === "question" && (
            <Button
              onClick={() => {
                if (chosen.length === 0) return

                getSocket().emit("player:answer", {
                  optionIds: chosen,
                })

                setPhase("answered")
              }}
              disabled={chosen.length === 0}
              className="mt-2"
            >
              Ответить
            </Button>
          )}

          {phase === "answered" && (
            <p className="mt-auto text-center font-medium text-muted-foreground">
              Ответ принят! Ждем остальных...
            </p>
          )}
        </div>
      )}

      {phase === "reveal" && (
        <div className="flex flex-1 flex-col gap-5">
          <Card
            className={`flex flex-col items-center gap-2 p-6 text-center ${
              answered &&
              reveal &&
              chosen.length === reveal.correctOptionIds.length &&
              chosen.every((id) => reveal.correctOptionIds.includes(id))
                ? "border-2 border-[color:var(--answer-4)]"
                : "border-2 border-destructive"
            }`}
          >
            {answered &&
            reveal &&
            chosen.length === reveal.correctOptionIds.length &&
            chosen.every((id) => reveal.correctOptionIds.includes(id)) ? (
              <>
                <Check className="h-10 w-10 text-[color:var(--answer-4)]" />
                <p className="text-xl font-bold">Верно!</p>
              </>
            ) : (
              <>
                <X className="h-10 w-10 text-destructive" />
                <p className="text-xl font-bold">
                  {!answered ? "Вы не ответили" : "Неверно"}
                </p>
              </>
            )}

            {typeof myScore === "number" && (
              <p className="text-muted-foreground">Ваш счет: {myScore}</p>
            )}
          </Card>

          <Leaderboard players={leaderboard} highlightName={nickname} />
        </div>
      )}

      {phase === "over" && (
        <div className="flex flex-1 flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <Trophy className="h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Квиз завершен!</h2>
          </div>
          <Leaderboard players={leaderboard} podium highlightName={nickname} />
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            В кабинет
          </Button>
        </div>
      )}

      <AlertDialog open={gameCancelled}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
              Игра отменена
            </AlertDialogTitle>

            <AlertDialogDescription>
              Организатор отменил игру.
              Через несколько секунд вы автоматически вернетесь на страницу подключения.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => router.push("/join")}
            >
              Понятно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
