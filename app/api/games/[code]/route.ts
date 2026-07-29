import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: "Не авторизован" },
      { status: 401 }
    )
  }

  const { code } = await params

  const game = db.prepare(
    "SELECT * FROM games WHERE code = ?"
  ).get(code) as any

  if (!game) {
    return NextResponse.json(
      { error: "Игра не найдена" },
      { status: 404 }
    )
  }

  if (game.host_id !== user.id) {
    return NextResponse.json(
      { error: "Нет доступа" },
      { status: 403 }
    )
  }

  db.prepare(
    "DELETE FROM games WHERE id = ?"
  ).run(game.id)

  return NextResponse.json({ ok: true })
}