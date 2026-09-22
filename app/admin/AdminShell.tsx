// Shared chrome (top nav + logout) for every protected /admin/* page, used by
// each page explicitly rather than a Next.js layout.tsx — a layout at
// app/admin/layout.tsx would also wrap app/admin/login/, which must stay its
// own plain centered card with no nav/logout (there's no session yet there).
// Server component: no client state of its own, LogoutButton is the one
// interactive island inside it.

import Link from "next/link"
import { Gauge, ImageIcon, Users } from "lucide-react"
import { LogoutButton } from "@/app/admin/LogoutButton"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/generations", label: "Generations", icon: ImageIcon },
] as const

export function AdminShell({ children, active }: { children: React.ReactNode; active: string }) {
  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-serif text-lg">Visualizer Admin</span>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="container mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  )
}
