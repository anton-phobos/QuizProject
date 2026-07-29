import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getGameByCode } from "@/lib/queries"
import { HostRoom } from "@/components/host-room"

export default async function HostPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const game = getGameByCode(code)
  if (!game) notFound()
  if (game.host_id !== user.id) redirect("/dashboard")

  return <HostRoom code={code} />
}
