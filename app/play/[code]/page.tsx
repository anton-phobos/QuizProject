import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PlayRoom } from "@/components/play-room"

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return <PlayRoom code={code.toUpperCase()} nickname={user.name} />
}
