import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppHeader } from "@/components/app-header"
import { QuizBuilder } from "@/components/quiz-builder"

export default async function NewQuizPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "organizer") redirect("/dashboard")

  return (
    <div className="min-h-screen">
      <AppHeader name={user.name} role={user.role} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <QuizBuilder />
      </main>
    </div>
  )
}
