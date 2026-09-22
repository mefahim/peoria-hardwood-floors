import { Lock } from "lucide-react"
import { LoginForm } from "@/app/admin/login/LoginForm"

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-5 font-serif text-2xl">Visualizer Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage the AI flooring visualizer.</p>
        </div>

        <div className="border border-border bg-background p-8 shadow-sm">
          <LoginForm next={next && next.startsWith("/admin") ? next : "/admin"} />
        </div>
      </div>
    </main>
  )
}
