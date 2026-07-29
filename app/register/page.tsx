"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Brain, GraduationCap, User } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<"participant" | "organizer">("participant")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || "Ошибка регистрации")
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </span>
          ProjectQuiz
        </Link>
        <Card>
          <h1 className="mb-1 text-2xl font-bold">Регистрация</h1>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <RoleButton
              active={role === "participant"}
              onClick={() => setRole("participant")}
              icon={<User className="h-5 w-5" />}
              label="Участник"
            />
            <RoleButton
              active={role === "organizer"}
              onClick={() => setRole("organizer")}
              icon={<GraduationCap className="h-5 w-5" />}
              label="Организатор"
            />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" name="name" required placeholder="Как вас зовут" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" name="password" type="password" required placeholder="Минимум 6 символов" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Создаем..." : "Зарегистрироваться"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Войти
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}

function RoleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-md border-2 p-3 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
