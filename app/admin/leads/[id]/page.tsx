import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { db } from "@/lib/db/client"
import { getLead, getGenerationsForLead, type GenerationRow } from "@/lib/db/generations"
import { AdminShell } from "@/app/admin/AdminShell"
import { VisitorStatusButton } from "@/app/admin/VisitorStatusButton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FINISH_PREFERENCE_OPTIONS,
  FLOOR_DIRECTION_OPTIONS,
  PREFERRED_STYLE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SHEEN_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  type VisualizerOptions,
} from "@/lib/visualizer/options"

export const dynamic = "force-dynamic"

function labelFor(options: readonly { value: string; label: string }[], value: string | null): string | null {
  if (!value) return null
  return options.find((o) => o.value === value)?.label ?? value
}

function describeOptions(options: VisualizerOptions): string {
  const parts = [
    labelFor(ROOM_TYPE_OPTIONS, options.roomType),
    labelFor(PROJECT_TYPE_OPTIONS, options.projectType),
    labelFor(PREFERRED_STYLE_OPTIONS, options.preferredStyle),
    labelFor(WOOD_SPECIES_OPTIONS, options.woodSpecies),
    labelFor(FLOOR_DIRECTION_OPTIONS, options.floorDirection),
    labelFor(FINISH_PREFERENCE_OPTIONS, options.finishPreference),
    labelFor(SHEEN_OPTIONS, options.sheen),
  ].filter(Boolean)
  return parts.join(" · ")
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "destructive" | "secondary"> = {
  success: "default",
  error: "destructive",
  timeout: "destructive",
  pending: "secondary",
}

function describeGeneration(row: GenerationRow): string {
  try {
    return describeOptions(JSON.parse(row.options_json))
  } catch {
    return "—"
  }
}

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = getLead(db, id)
  if (!lead) notFound()

  const generations = getGenerationsForLead(db, id)

  return (
    <AdminShell active="/admin/leads">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      <Card className="mt-4">
        <CardContent className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl">{lead.name}</h1>
              {lead.visitor_status !== "active" && <Badge variant="destructive">{lead.visitor_status}</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
              <span>Submitted {formatTimestamp(lead.created_at)}</span>
            </div>
          </div>
          <VisitorStatusButton visitorId={lead.visitor_id} currentStatus={lead.visitor_status} />
        </CardContent>
      </Card>

      {lead.flag_reason && (
        <Alert className="mt-4" variant="destructive">
          <AlertDescription>{lead.flag_reason}</AlertDescription>
        </Alert>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-medium">Generation history ({generations.length})</h2>
        {generations.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No generations recorded.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {generations.map((row) => (
              <Card key={row.id}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:gap-4">
                  <div className="h-32 w-full shrink-0 overflow-hidden rounded-md bg-secondary sm:h-20 sm:w-28">
                    {row.output_image_ref ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/admin/generation-image?id=${row.id}&kind=output`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_BADGE_VARIANT[row.status] ?? "secondary"}>{row.status}</Badge>
                      <span className="text-muted-foreground">{row.provider}</span>
                      {!!row.is_fallback && <Badge variant="secondary">fallback shown</Badge>}
                      {!!row.is_post_lead && <Badge variant="secondary">post-lead</Badge>}
                      <span className="text-muted-foreground">· {formatTimestamp(row.created_at)}</span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{describeGeneration(row)}</p>
                    {row.error_message && <p className="mt-1 text-destructive">{row.error_message}</p>}
                    {row.input_image_ref && (
                      <a href={`/api/admin/generation-image?id=${row.id}&kind=input`} className="mt-2 inline-block text-xs underline underline-offset-4">
                        View original uploaded photo
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  )
}
