"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Check, ArrowLeft, ImageIcon, AlertTriangle } from "lucide-react"
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

const CATEGORIES = [
  { value: "Общее", label: "Общее" },
  { value: "Развлечения", label: "Развлечения" },
  { value: "Знаменитости", label: "Знаменитости" },
  { value: "География", label: "География" },
  { value: "Мультфильмы", label: "Мультфильмы" },
  { value: "Технологии", label: "Технологии" },
  { value: "Музыка", label: "Музыка" }
]

interface Option {
  text: string
  is_correct: boolean
}
interface Question {
  text: string
  image_url: string
  allow_multiple: boolean
  options: Option[]
}
interface QuizData {
  id: number
  title: string
  description: string
  category: string
  seconds_per_question: number
  questions: Question[]
}

function emptyQuestion(): Question {
  return {
    text: "",
    image_url: "",
    allow_multiple: false,
    options: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  }
}

export function QuizBuilder({
  mode = "create",
  initialData,
}: {
  mode?: "create" | "edit"
  initialData?: QuizData
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [category, setCategory] = useState(initialData?.category ?? "Технологии")
  const [seconds, setSeconds] = useState(
    initialData?.seconds_per_question ?? 20
  )
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions?.map((q) => ({
      ...q,
      allow_multiple: q.allow_multiple ?? false,
    })) ?? [emptyQuestion()]
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function updateQuestion(qi: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)))
  }
  function updateOption(qi: number, oi: number, patch: Partial<Option>) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) }
          : q,
      ),
    )
  }
  function setCorrect(qi: number, oi: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q

        if (q.allow_multiple) {
          return {
            ...q,
            options: q.options.map((o, j) =>
              j === oi
                ? { ...o, is_correct: !o.is_correct }
                : o
            ),
          }
        }

        return {
          ...q,
          options: q.options.map((o, j) => ({
            ...o,
            is_correct: j === oi,
          })),
        }
      }),
    )
  }

  async function submit() {
    setError("")
    setLoading(true)
    const res = await fetch(
      mode === "create"
        ? "/api/quizzes"
        : `/api/quizzes/${initialData!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        seconds_per_question: seconds,
        questions,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || "Не удалось сохранить квиз")
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  async function removeQuiz() {
    setLoading(true)

    const res = await fetch(`/api/quizzes/${initialData!.id}`, {
      method: "DELETE",
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Не удалось удалить квиз")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex items-center justify-center">
        <Button
          asChild
          variant="outline"
          className="absolute left-0"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>

        <h1 className="text-2xl font-bold text-center">
          {mode === "create" ? "Новый квиз" : "Редактирование квиза"}
        </h1>
      </div>

      <Card className="flex flex-col gap-5 p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <Label htmlFor="title">Название</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Викторина по географии"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="desc">Описание</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Короткое описание квиза"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Label>Категория</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="seconds">Время на вопрос (сек)</Label>
            <Input
              id="seconds"
              type="number"
              min={5}
              max={120}
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
            />
          </div>
        </div>
      </Card>

      {questions.map((q, qi) => (
        <Card key={qi} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-lg font-semibold">
              Вопрос {qi + 1}
            </h3>
            {questions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Label>Текст вопроса</Label>
            <Input
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              placeholder="Введите вопрос"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label className="flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4" />
              URL изображения
            </Label>
            <Input
              value={q.image_url}
              onChange={(e) => updateQuestion(qi, { image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id={`allow-multiple-${qi}`}
              type="checkbox"
              checked={q.allow_multiple}
              onChange={(e) =>
                updateQuestion(qi, {
                  allow_multiple: e.target.checked,
                })
              }
            />
            <Label htmlFor={`allow-multiple-${qi}`}>
              Несколько правильных ответов
            </Label>
          </div>

          <div className="flex flex-col gap-3">
            <Label>
              {q.allow_multiple
                ? "Варианты ответа"
                : "Варианты ответа"}
            </Label>
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCorrect(qi, oi)}
                  aria-label="Отметить правильным"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    o.is_correct
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-transparent hover:border-primary/40"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </button>
                <Input
                  value={o.text}
                  onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                  placeholder={`Вариант ${oi + 1}`}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
      >
        <Plus className="h-4 w-4" />
        Добавить вопрос
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        {mode === "edit" ? (
          <AlertDialog>
            <AlertDialogTrigger variant="destructive">
              Удалить квиз
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Удалить квиз?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  История уже проведенных игр сохранится.
                  Это действие нельзя будет отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Отмена
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={removeQuiz}
                  variant="destructive"
                >
                  Да, удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div />
        )}

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Отмена</Link>
          </Button>

          <Button onClick={submit} disabled={loading}>
            {loading
              ? "Сохранение..."
              : mode === "create"
              ? "Сохранить квиз"
              : "Сохранить изменения"}
          </Button>
        </div>
      </div>
    </div>
  )
}
