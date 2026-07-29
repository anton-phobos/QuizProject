import Link from "next/link"
import { Brain } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"

export function AppHeader({ name, role }: { name: string; role: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-18 w-full max-w-5xl items-center justify-between px-6">
        <div className="flex w-32 items-center justify-start">
          <div className="text-left leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">
              {role === "organizer" ? "Организатор" : "Участник"}
            </div>
          </div>
        </div>

        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </span>
          ProjectQuiz
        </Link>

        {/* Правая часть — выход */}
        <div className="flex w-32 items-center justify-end">
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}