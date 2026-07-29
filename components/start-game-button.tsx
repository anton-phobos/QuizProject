"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

export function StartGameButton({ quizId, disabled }: { quizId: number; disabled?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function start(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) router.push(`/host/${data.code}`)
    else alert(data.error || "Не удалось запустить игру")
  }

  return (
    <Button onClick={start} disabled={disabled || loading} className="mt-auto w-full">
      <Play className="h-4 w-4" />
      {loading ? "Запуск..." : "Запустить игру"}
    </Button>
  )
}
