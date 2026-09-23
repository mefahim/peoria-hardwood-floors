import { Activity, FileText, Link2, MapPinned, SearchCheck, Settings2, Sparkles } from "lucide-react"
import { AdminShell } from "@/app/admin/AdminShell"
import { requireSeoDashboardAccess } from "@/lib/admin/authorization"
import { INTERACTIVE_ROUTE_POLICY, PUBLIC_STATIC_ROUTES } from "@/lib/seo/resolver"
import { services } from "@/lib/site"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

const MODULES = [
  { label: "Pages", description: "Read-only view of public page metadata and indexability.", icon: FileText },
  { label: "Services", description: "Review the six centralized service records.", icon: Activity },
  { label: "Topics & Content", description: "Governed content planning is not editable in this phase.", icon: Sparkles },
  { label: "Local SEO", description: "Verified local entity and location gates remain authoritative.", icon: MapPinned },
  { label: "Case Studies", description: "No case-study publishing is enabled yet.", icon: FileText },
  { label: "Internal Links", description: "Link governance will be added in a later phase.", icon: Link2 },
  { label: "Image SEO", description: "Image metadata and performance are tracked separately.", icon: FileText },
  { label: "SEO Audit", description: "Audit workflows are not editable in this foundation phase.", icon: SearchCheck },
  { label: "Settings", description: "Dashboard settings and role management are not enabled yet.", icon: Settings2 },
  { label: "Change History", description: "No SEO mutation history exists because mutations are disabled.", icon: FileText },
] as const

export default async function SeoDashboardPage() {
  const principal = await requireSeoDashboardAccess()
  const publicPageCount = PUBLIC_STATIC_ROUTES.length + services.length
  const utilityPageCount = Object.values(INTERACTIVE_ROUTE_POLICY).length

  return (
    <AdminShell active="/admin/seo">
      <div className="flex flex-col gap-3 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Protected SEO workspace</p>
          <h1 className="mt-3 font-serif text-3xl">SEO Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A read-only foundation connected to the existing SEO resolver, entity graph, local safeguards, and content governance. No SEO edits or publishing actions are enabled here.
          </p>
        </div>
        <Badge variant="secondary">{principal.role} access</Badge>
      </div>

      <section aria-labelledby="status-heading" className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="status-heading" className="text-lg font-medium">System status</h2>
            <p className="mt-1 text-sm text-muted-foreground">Only values derivable from the current application are shown.</p>
          </div>
          <Badge>Read only</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">{publicPageCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Indexable public pages</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">{services.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Centralized services</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">{utilityPageCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Utility pages kept noindex</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="modules-heading" className="mt-10">
        <div>
          <h2 id="modules-heading" className="text-lg font-medium">Dashboard modules</h2>
          <p className="mt-1 text-sm text-muted-foreground">Future modules are shown as controlled placeholders; no fake data or mutation controls are exposed.</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {MODULES.map((module) => (
            <Card key={module.label}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <module.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.label}</CardTitle>
                    <CardDescription className="mt-1 leading-5">{module.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">Planned</Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="connection-heading" className="mt-10 border border-border bg-secondary/30 p-6">
        <h2 id="connection-heading" className="text-lg font-medium">Unavailable data</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Search Console, traffic, rankings, impressions, clicks, conversions, SEO scores, and mutation history are <strong className="font-medium text-foreground">Not connected yet</strong>. They are not estimated or fabricated by this dashboard.
        </p>
      </section>
    </AdminShell>
  )
}
