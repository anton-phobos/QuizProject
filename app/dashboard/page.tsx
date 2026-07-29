import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getMyQuizzes, getHostHistory, getPlayHistory } from "@/lib/queries"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StartGameButton } from "@/components/start-game-button"
import { Plus, Mailbox, Trophy, Clock, Users, Gamepad } from "lucide-react"

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen">
      <AppHeader name={user.name} role={user.role} />

      <main className="mx-auto w-full max-w-5xl px-6 py-8">

        <div className="flex flex-col gap-8">

          <section>
            <h1 className="text-3xl font-bold text-center">
              Привет, {user.name} 👋
            </h1>
          </section>
          {user.role === "organizer" ? (
            <OrganizerDashboard userId={user.id}/>
          ) : (
            <ParticipantDashboard userId={user.id}/>
          )}
        </div>
      </main>
    </div>
  )
}

function OrganizerDashboard({ userId }: { userId: number }) {
  const quizzes = getMyQuizzes(userId)
  const history = getHostHistory(userId)

  return (
    <div className="flex flex-col gap-8">
      <Card className="
        flex
        flex-row
        items-center
        gap-6
        p-6
      ">

        <div className="flex-1">

          <h2 className="
            text-xl
            font-bold
            leading-tight
          ">
            Создать новый квиз
          </h2>


          <p className="
            mt-1
            text-sm
            leading-relaxed
            text-muted-foreground
          ">
            Создайте игру и пригласите участников
          </p>

        </div>


        <Button asChild className="shrink-0">

          <Link href="/quizzes/new">

            <Plus className="mr-2 h-4 w-4" />

            Создать

          </Link>

        </Button>


      </Card>

      <section>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-center">
            Мои квизы
          </h1>
        </div>


        {quizzes.length === 0 ? (

          <EmptyState
            icon={<Mailbox className="h-6 w-6" />}
            title="У вас нет квизов."
            text="Создайте свой первый квиз."
          />

        ) : (

          <div className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
          ">

            {quizzes.map((q)=>(
              
              <Link
                key={q.id}
                href={`/quizzes/${q.id}`}
              >

                <Card className="
                  flex
                  flex-col
                  gap-3
                  p-5
                  transition-all
                  hover:border-primary
                  hover:shadow-md
                ">


                  <div className="
                    flex
                    items-start
                    justify-between
                  ">

                    <h3 className="font-semibold">
                      {q.title}
                    </h3>


                    <Badge variant="secondary">
                      {q.category}
                    </Badge>

                  </div>


                  <div className="
                    flex
                    gap-4
                    text-sm
                    text-muted-foreground
                  ">

                    <span className="flex gap-1 items-center">
                      <Mailbox className="h-4 w-4"/>
                      {q.question_count} вопр.
                    </span>


                    <span className="flex gap-1 items-center">
                      <Clock className="h-4 w-4"/>
                      {q.seconds_per_question} сек
                    </span>

                  </div>


                  <StartGameButton
                    quizId={q.id}
                    disabled={q.question_count === 0}
                  />


                </Card>

              </Link>

            ))}

          </div>

        )}

      </section>

      <section>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-center">
            История проведенных игр
          </h2>
        </div>

        {history.length === 0 ? (

          <EmptyState
            icon={<Gamepad className="h-6 w-6"/>}
            title="Вы еще не запускали игры."
            text="Их история появится здесь."
          />

        ) : (

          <div className="
            grid
            gap-3
            lg:grid-cols-2
          ">

            {history.map((g)=>(

              <Card
                key={g.id}
                className="
                  flex
                  items-center
                  justify-between
                  p-4
                  transition-all
                  hover:border-primary
                "
              >
                <div>

                  <h3 className="font-semibold text-center">
                    {g.title}
                  </h3>

                  <p className="
                    text-sm
                    text-muted-foreground
                  ">
                    Код комнаты: {g.code}
                  </p>

                  <div className="
                    mt-1
                    flex
                    gap-3
                    text-xs
                    text-muted-foreground
                  ">

                    <span>
                      {formatDate(g.created_at)}
                    </span>


                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3"/>
                      {g.players}
                    </span>

                  </div>

                </div>

                <Badge
                  variant={
                    g.status === "finished"
                      ? "secondary"
                      : "default"
                  }
                >
                  {
                    g.status === "finished"
                    ? "Завершен"
                    : "Идет"
                  }
                </Badge>


              </Card>

            ))}

          </div>

        )}

      </section>


    </div>
  )
}

function ParticipantDashboard({ userId }: { userId: number }) {
  const history = getPlayHistory(userId)

  return (
    <div className="flex flex-col gap-8">
      <Card className="
        flex
        flex-row
        items-center
        gap-6
        p-6
      ">

        <div className="flex-1">

          <h1 className="
            text-xl
            font-bold
            leading-tight
          ">
            Присоединиться к игре
          </h1>


          <p className="
            mt-1
            text-sm
            leading-relaxed
            text-muted-foreground
          ">
            Введите код комнаты, чтобы подключиться к активной игре.
          </p>

        </div>


        <Button asChild className="shrink-0">
          <Link href="/join">
            Ввести код
          </Link>
        </Button>


      </Card>
      <section>
        <h2 className="
          mb-4
          text-2xl
          font-bold
          text-center
        ">
          История игр
        </h2>
        {history.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-6 w-6"/>}
            title="Примите участие в игре."
            text="Ваши результаты появятся здесь."
          />
        ) : (
          <div className="
            grid
            gap-3
            md:grid-cols-2
          ">
            {history.map((g)=>(
              <Card
                key={g.game_id}
                className="
                  flex
                  items-center
                  justify-between
                  p-4
                "
              >
                <div>
                  <h3 className="font-semibold text-center">
                    {g.title}
                  </h3>
                  <p className="
                    text-sm
                    text-muted-foreground
                  ">
                    {formatDate(g.created_at)}
                  </p>
                </div>
                <div className="
                  flex
                  flex-col
                  items-center
                  gap-1
                ">
                  <p className="text-xs text-muted-foreground">
                    Место
                  </p>
                  <p className="font-bold">
                    {g.rank}/{g.total}
                  </p>
                  <p className="
                    flex
                    items-center
                    gap-1
                    text-primary
                    font-bold
                  ">
                    <Trophy className="h-4 w-4"/>
                    {g.score}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  text,
  button,
}: {
  icon: React.ReactNode
  title: string
  text?: string
  button?: React.ReactNode
}) {
  return (
    <Card className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {button}
    </Card>
  )
}