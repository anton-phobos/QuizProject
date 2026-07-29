import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle2, Sparkles } from "lucide-react"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-muted/30 px-6">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
        <section className="flex flex-col justify-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Brain className="h-8 w-8" />
          </div>

          <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
            Онлайн-платформа для квизов
          </span>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight lg:text-6xl">
            Создавайте
            <span className="block text-primary">интерактивные квизы</span>
            за несколько минут
          </h1>

          <p className="mb-10 max-w-lg text-muted-foreground">
            Создавайте вопросы, приглашайте участников и следите за
            результатами во время игры.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link href="/login">Войти</Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link href="/register">Создать аккаунт</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}