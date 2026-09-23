// Shared protected chrome for every /admin/* page. Authentication remains
// server-side in middleware.ts and each protected page continues to authorize
// its own data access before rendering this shell.
import Link from "next/link"
import {
  Activity,
  FileText,
  Gauge,
  History,
  ImageIcon,
  LayoutDashboard,
  Link2,
  MapPinned,
  SearchCheck,
  Settings2,
  Users,
  WandSparkles,
} from "lucide-react"
import { LogoutButton } from "@/app/admin/LogoutButton"
import { MobileAdminNav } from "@/app/admin/MobileAdminNav"

type NavItem = {
  href: string
  label: string
  icon: typeof Gauge
  exact?: boolean
}

export const WORKSPACE_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/seo", label: "SEO Overview", icon: SearchCheck },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/generations", label: "Generations", icon: WandSparkles },
]

export const SEO_NAV: NavItem[] = [
  { href: "/admin/seo#pages-services", label: "Pages & Services", icon: FileText },
  { href: "/admin/seo#topics-content", label: "Topics & Content", icon: Activity },
  { href: "/admin/seo#content-briefs", label: "Content Briefs", icon: Settings2 },
  { href: "/admin/seo#local-seo", label: "Local SEO", icon: MapPinned },
  { href: "/admin/seo#case-studies", label: "Case Studies", icon: FileText },
  { href: "/admin/seo#internal-links", label: "Internal Links", icon: Link2 },
  { href: "/admin/seo#image-seo", label: "Image SEO", icon: ImageIcon },
  { href: "/admin/seo#change-history", label: "Change History", icon: History },
]

const PAGE_TITLES: Record<string, { eyebrow: string; title: string }> = {
  "/admin": { eyebrow: "Workspace", title: "Overview" },
  "/admin/seo": { eyebrow: "SEO workspace", title: "SEO Overview" },
  "/admin/leads": { eyebrow: "Workspace", title: "Leads" },
  "/admin/generations": { eyebrow: "Workspace", title: "Generations" },
}

function NavLink({ item, active }: { item: NavItem; active: string }) {
  const isActive = item.exact ? active === item.href : active.startsWith(item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
    </Link>
  )
}

export function AdminShell({ children, active }: { children: React.ReactNode; active: string }) {
  const page = PAGE_TITLES[active] ?? PAGE_TITLES["/admin"]
  return (
    <div className="min-h-screen overflow-x-hidden bg-secondary/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-20 shrink-0 items-center border-b border-sidebar-border px-6">
          <Link href="/admin" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Peoria Hardwood Floors operations console">
            <p className="font-serif text-lg leading-tight text-sidebar-foreground">Peoria Hardwood Floors</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/50">Operations Console</p>
          </Link>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-6" aria-label="Admin workspace navigation">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">Workspace</p>
          <div className="mt-3 space-y-1">
            {WORKSPACE_NAV.map((item) => <NavLink key={item.href} item={item} active={active} />)}
          </div>
          <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">SEO workspace</p>
          <div className="mt-3 space-y-1">
            {SEO_NAV.map((item) => <NavLink key={item.href} item={item} active={active} />)}
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-md bg-sidebar-accent/60 px-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">A</div>
            <div className="min-w-0"><p className="truncate text-xs font-medium">Administrator</p><p className="mt-0.5 text-[11px] text-sidebar-foreground/50">Protected session</p></div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <MobileAdminNav active={active} workspace={WORKSPACE_NAV.map(({ href, label }) => ({ href, label }))} seo={SEO_NAV.map(({ href, label }) => ({ href, label }))} />
              <div className="hidden h-7 w-px bg-border sm:block" aria-hidden="true" />
              <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{page.eyebrow}</p><h1 className="truncate text-sm font-semibold sm:text-base">{page.title}</h1></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Link href="/" target="_blank" rel="noreferrer" className="hidden text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:inline-flex">View site</Link>
              <span className="hidden items-center gap-2 text-xs text-muted-foreground lg:inline-flex"><span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />Protected session</span>
              <div className="md:hidden"><LogoutButton /></div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
