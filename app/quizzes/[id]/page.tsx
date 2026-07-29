import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getQuizWithQuestions } from "@/lib/queries"
import { AppHeader } from "@/components/app-header"
import { QuizBuilder } from "@/components/quiz-builder"

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { id } = await params

  const quiz = getQuizWithQuestions(Number(id))

  if (!quiz) {
    redirect("/dashboard")
  }

  if (quiz.owner_id !== user.id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen">
      <AppHeader name={user.name} role={user.role} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <QuizBuilder mode="edit" initialData={quiz} />
      </main>
    </div>
  )
}