// Overview dashboard: quick stats, switch which visualization provider is
// active, change the admin password, see a warning if the last attempt
// failed, and browse recent generations. Protected by middleware.ts — not
// linked from the public site nav.

import { AlertTriangle, FileWarning, Flag, Images, UserCheck, Users } from "lucide-react"
import { AVAILABLE_PROVIDERS, getActiveProvider, getCredentialStatus, getRecentGenerations, hasAdminPasswordOverride } from "@/lib/visualizer/admin-store"
import { db } from "@/lib/db/client"
import { getGenerationStats, listFlaggedOrBlockedVisitors, listLeads } from "@/lib/db/generations"
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
import { AdminShell } from "@/app/admin/AdminShell"
import { ProviderSwitcher } from "@/app/admin/ProviderSwitcher"
import { CredentialEditor } from "@/app/admin/CredentialEditor"
import { PasswordEditor } from "@/app/admin/PasswordEditor"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    options.preferredStyle === "custom" && options.customStyleDescription ? `"${options.customStyleDescription}"` : null,
    labelFor(WOOD_SPECIES_OPTIONS, options.woodSpecies),
    labelFor(FLOOR_DIRECTION_OPTIONS, options.floorDirection),
    labelFor(FINISH_PREFERENCE_OPTIONS, options.finishPreference),
    labelFor(SHEEN_OPTIONS, options.sheen),
    options.serviceCity,
    options.squareFootage ? `${options.squareFootage} sq ft` : null,
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
}

export default async function AdminDashboardPage() {
  const [activeProvider, recent, credentialStatus, usingPasswordOverride] = await Promise.all([
    getActiveProvider(),
    getRecentGenerations(30),
    getCredentialStatus(),
    hasAdminPasswordOverride(),
  ])
  // Synchronous (Node.js built-in SQLite) — no Promise.all needed for these.
  const generationStats = getGenerationStats(db)
  const leads = listLeads(db, { limit: 1000 })
  const flagged = listFlaggedOrBlockedVisitors(db)
  const latest = recent[0] ?? null
  const latestFailed = latest && latest.status !== "success"

  const stats = [
    { label: "Total leads", value: leads.length, icon: Users },
    { label: "Generations", value: generationStats.total, icon: Images },
    { label: "Delivered", value: generationStats.success, icon: UserCheck },
    { label: "Flagged / blocked", value: flagged.length, icon: Flag },
  ]

  return (
    <AdminShell active="/admin">
      <div>
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Simple controls for the AI flooring visualizer.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
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

      {latestFailed && (
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle />
          <AlertTitle>The most recent generation failed</AlertTitle>
          <AlertDescription>
            {formatTimestamp(latest.createdAt)}, provider: {latest.provider}. {latest.errorMessage ?? "No error message recorded."} If this keeps happening, the provider's account
            (credits/balance/access) likely needs attention.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active provider</CardTitle>
          </CardHeader>
          <CardContent>
            <ProviderSwitcher current={activeProvider} options={AVAILABLE_PROVIDERS} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hugging Face API token</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Used by the Hugging Face / fal.ai provider. Updating it here takes effect immediately, no restart needed.</p>
            <CredentialEditor configured={credentialStatus.hfToken.configured} source={credentialStatus.hfToken.source} masked={credentialStatus.hfToken.masked} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Admin password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordEditor usingDashboardOverride={usingPasswordOverride} />
        </CardContent>
      </Card>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-medium">Recent generations ({recent.length})</h2>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No generations yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recent.map((entry) => (
              <Card key={entry.requestId}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:gap-4">
                  <div className="h-32 w-full shrink-0 overflow-hidden rounded-md bg-secondary sm:h-20 sm:w-28">
                    {entry.imageUrl && entry.status === "success" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_BADGE_VARIANT[entry.status] ?? "secondary"}>{entry.status}</Badge>
                      <span className="text-muted-foreground">{entry.provider}</span>
                      <span className="text-muted-foreground">· {formatTimestamp(entry.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{describeOptions(entry.options) || "No options recorded."}</p>
                    {entry.errorMessage && <p className="mt-1 text-destructive">{entry.errorMessage}</p>}
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
