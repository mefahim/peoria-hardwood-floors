// Leads captured through the visualizer's quota gate. Protected by middleware.ts
// (same as /admin) — not linked from the public site nav.

import Link from "next/link"
import { ChevronRight, Mail, Phone } from "lucide-react"
import { db } from "@/lib/db/client"
import { listLeads } from "@/lib/db/generations"
import { AdminShell } from "@/app/admin/AdminShell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

const STATUS_BADGE_VARIANT: Record<string, "secondary" | "destructive"> = {
  flagged: "destructive",
  blocked: "destructive",
}

export default function AdminLeadsPage() {
  const leads = listLeads(db, { limit: 200 })

  return (
    <AdminShell active="/admin/leads">
      <div>
        <h1 className="font-serif text-3xl">Leads</h1>
        <p className="mt-2 text-sm text-muted-foreground">Everyone who's shared their contact info to unlock an extra free visualization — every submission is its own record.</p>
      </div>

      <div className="mt-8">
        {leads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">No leads yet — they'll show up here once a visitor unlocks a bonus visualization.</CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden py-0">
            <div className="divide-y divide-border">
              {leads.map((lead) => (
                <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">{initialsOf(lead.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{lead.name}</span>
                      {lead.visitor_status !== "active" && <Badge variant={STATUS_BADGE_VARIANT[lead.visitor_status] ?? "secondary"}>{lead.visitor_status}</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">{formatTimestamp(lead.created_at)}</div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
