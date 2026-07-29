"use client"

import { useEffect, useState } from "react"

export function Countdown({ endsAt, seconds }: { endsAt: number; seconds: number }) {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    function tick() {
      setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [endsAt])

  const pct = Math.max(0, Math.min(100, (left / seconds) * 100))
  const urgent = left <= 5

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all duration-200 ${urgent ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`w-8 text-right font-mono text-lg font-bold ${urgent ? "text-destructive" : "text-foreground"}`}
      >
        {left}
      </span>
    </div>
  )
}
