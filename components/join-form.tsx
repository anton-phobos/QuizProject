"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (clean.length < 4) return
    router.push(`/play/${clean}`)
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="px-6 py-3">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Код комнаты"
            aria-label="Код комнаты"
            maxLength={6}
            className="h-14 text-center text-2xl font-bold tracking-[0.3em]"
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={code.trim().length < 4}>
            Войти в игру
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
