import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppHeader } from "@/components/app-header"
import { JoinForm } from "@/components/join-form"

export default async function JoinPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-dvh">
      <AppHeader name={user.name} role={user.role} />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="text-center">
          <h1 className="text-balance text-3xl font-bold">Присоединиться к игре</h1>
          <p className="mt-2 text-muted-foreground">Введите код комнаты, предоставленный организатором</p>
        </div>
        <JoinForm />
      </main>
    </div>
  )
}
