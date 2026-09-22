// Usage/quota overview: success vs failure breakdown, flagged/blocked visitors,
// and recent denied requests — the "suspicious/blocked activity visibility" and
// "basic AI usage visibility" admin requirement. Protected by middleware.ts.

import Link from "next/link"
import { AlertOctagon, CheckCircle2, ImageIcon, Layers, ShieldAlert, XCircle } from "lucide-react"
import { db } from "@/lib/db/client"
import { getGenerationStats, listFlaggedOrBlockedVisitors, listRecentBlockedEvents } from "@/lib/db/generations"
import { AdminShell } from "@/app/admin/AdminShell"
import { VisitorStatusButton } from "@/app/admin/VisitorStatusButton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function AdminGenerationsPage() {
  const stats = getGenerationStats(db)
  const flaggedVisitors = listFlaggedOrBlockedVisitors(db)
  const blockedEvents = listRecentBlockedEvents(db, 30)

  const statCards = [
    { label: "Total generations", value: stats.total, icon: Layers },
    { label: "Delivered", value: stats.success, icon: CheckCircle2 },
    { label: "Failed", value: stats.error + stats.timeout, icon: XCircle },
    { label: "Fallback shown", value: stats.fallback, icon: ImageIcon },
  ]

  return (
    <AdminShell active="/admin/generations">
      <div>
        <h1 className="font-serif text-3xl">Generations & Usage</h1>
        <p className="mt-2 text-sm text-muted-foreground">Quota-linked generation records, separate from the legacy attempt log on the main dashboard.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        By provider:{" "}
        {Object.entries(stats.byProvider)
          .map(([provider, count]) => `${provider}: ${count}`)
          .join(" · ") || "—"}
        . Real-provider call count is the closest proxy available for AI cost — no Hugging Face billing API is integrated, so this is a count, not a dollar figure.
      </p>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Flagged / blocked visitors ({flaggedVisitors.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            "Flagged" is informational only (e.g. the same email reused across a different browser session) — it never blocks a visitor on its own. "Blocked" is a manual admin action. Clearing
            cookies or using a different device isn't preventable without requiring login, so this list is a review tool, not a guarantee.
          </p>
        </CardHeader>
        <CardContent>
          {flaggedVisitors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing flagged.</p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {flaggedVisitors.map((visitor) => (
                <div key={visitor.id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive">{visitor.status}</Badge>
                    <span className="text-muted-foreground">{visitor.flag_reason}</span>
                    <span className="text-xs text-muted-foreground">
                      ({visitor.ip ?? "unknown ip"}, {formatTimestamp(visitor.created_at)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {visitor.lead_id && (
                      <Link href={`/admin/leads/${visitor.lead_id}`} className="text-xs underline underline-offset-4">
                        View lead
                      </Link>
                    )}
                    <VisitorStatusButton visitorId={visitor.id} currentStatus={visitor.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5" />
            Recent denied requests ({blockedEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing denied recently.</p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border text-sm">
              {blockedEvents.map((event) => (
                <div key={event.id} className="flex flex-col gap-1 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {event.outcome} — {event.reason}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.ip ?? "unknown ip"} · {formatTimestamp(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
