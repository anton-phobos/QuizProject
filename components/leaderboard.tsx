import { Card } from "@/components/ui/card"
import { Trophy } from "lucide-react"

interface Player {
  userId: number
  nickname: string
  score: number
}

const MEDAL = ["text-yellow-500", "text-zinc-400", "text-amber-700"]

export function Leaderboard({
  players,
  podium = false,
  highlightUserId,
  highlightName,
}: {
  players: Player[]
  podium?: boolean
  highlightUserId?: number
  highlightName?: string
}) {
  if (players.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">Нет участников</p>
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {players.map((p, i) => {
        const isMe = highlightUserId === p.userId || highlightName === p.nickname
        return (
          <Card
            key={p.userId}
            className={`flex items-center gap-3 p-3 ${
              isMe ? "border-primary bg-primary/5" : ""
            } ${podium && i === 0 ? "scale-[1.02]" : ""}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              {i < 3 ? (
                <Trophy className={`h-5 w-5 ${MEDAL[i]}`} />
              ) : (
                <span className="font-mono text-sm font-semibold text-muted-foreground">
                  {i + 1}
                </span>
              )}
            </div>
            <span className="flex-1 truncate font-medium">
              {p.nickname}
              {isMe && <span className="ml-1 text-xs text-primary">(вы)</span>}
            </span>
            <span className="font-mono font-bold text-primary">{p.score}</span>
          </Card>
        )
      })}
    </div>
  )
}
