"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Phase07Snapshot, ReviewState } from "@/lib/seo/phase07"

type Props = { initialSnapshot: Phase07Snapshot; canReview: boolean }
const badge = (value: string) => <Badge variant={/[blocked|missing|flagged|rejected|keyword|generic]/i.test(value) ? "destructive" : "secondary"}>{value}</Badge>

export function Phase07Client({ initialSnapshot, canReview }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [tab, setTab] = useState<"links" | "images" | "history">("links")
  const [saving, setSaving] = useState<string | null>(null)
  async function review(kind: "link" | "image", id: string, state: ReviewState) {
    setSaving(id)
    const result = await fetch("/api/admin/seo/phase07", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, id, state }) })
    if (result.ok) {
      const refreshed = await fetch("/api/admin/seo/phase07")
      if (refreshed.ok) setSnapshot((await refreshed.json()).data)
    }
    setSaving(null)
  }
  return <div className="mt-8 space-y-8">
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Phase 07 views">
      {(["links", "images", "history"] as const).map((value) => <button key={value} role="tab" aria-selected={tab === value} type="button" onClick={() => setTab(value)} className={`rounded-md border px-4 py-2 text-sm ${tab === value ? "bg-foreground text-background" : "bg-background"}`}>{value === "links" ? "Internal Links & Orphans" : value === "images" ? "Image SEO" : "Change History"}</button>)}
    </div>
    {tab === "links" && <>
      <Card><CardHeader><CardTitle>Internal-link inventory</CardTitle><CardDescription>Existing links are derived from the approved content registry. Blocked destinations remain visible for governance review and are never auto-published.</CardDescription></CardHeader><CardContent className="space-y-3">{snapshot.internalLinks.map((link) => <div key={link.id} className="rounded-lg border p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{link.sourceRoute} → {link.targetRoute}</span><span className="flex gap-2">{badge(link.existing ? "existing" : "suggested")}{badge(link.status)}{badge(link.reviewState)}</span></div><div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-3"><span>Context: {link.context}</span><span>Relation: {link.relation}</span><span>Intent: {link.searchIntent} · {link.geographicRelevance}</span></div>{link.governanceIssues.length > 0 && <p className="mt-2 text-destructive">Governance: {link.governanceIssues.join(" ")}</p>} {canReview && <div className="mt-3 flex gap-2"><button disabled={saving === link.id} onClick={() => review("link", link.id, "REVIEW")} className="rounded border px-3 py-1.5 text-xs">Move to review</button><button disabled={saving === link.id || link.status === "blocked"} onClick={() => review("link", link.id, "ACCEPTED")} className="rounded border px-3 py-1.5 text-xs">Accept recommendation</button><button disabled={saving === link.id} onClick={() => review("link", link.id, "REJECTED")} className="rounded border px-3 py-1.5 text-xs">Reject</button></div>}</div>)}{snapshot.internalLinks.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No internal links are available from the current content registry.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Orphan-page candidates</CardTitle><CardDescription>Only published, approved, indexable public records are considered. Utility and private routes are excluded.</CardDescription></CardHeader><CardContent className="space-y-3">{snapshot.orphans.map((orphan) => <div key={orphan.route} className="grid gap-2 rounded-lg border p-4 text-sm sm:grid-cols-5"><span className="font-medium">{orphan.route}</span><span>Type: {orphan.pageType}</span><span>Inbound links: <strong>{orphan.inboundLinks}</strong></span><span>Topic: {orphan.relatedTopic ?? "Unavailable"}</span><span>{orphan.opportunity ? badge("actionable opportunity") : badge("linked")}</span></div>)}{snapshot.orphans.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No public orphan candidates are present.</p>}</CardContent></Card>
    </>}
    {tab === "images" && <Card><CardHeader><CardTitle>Image SEO inventory</CardTitle><CardDescription>Static asset metadata is read from the repository. Alt text and runtime usage are marked unavailable where the source contract does not provide evidence.</CardDescription></CardHeader><CardContent className="space-y-3">{snapshot.images.map((image) => <div key={image.id} className="rounded-lg border p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{image.assetPath}</span><span className="flex gap-2">{badge(image.fileType)}{badge(image.altStatus)}{badge(image.reviewState)}</span></div><div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-4"><span>Dimensions: {image.width && image.height ? `${image.width}×${image.height}` : "Unavailable"}</span><span>Size: {(image.sizeBytes / 1024).toFixed(1)} KB</span><span>Alt: {image.altText ?? "Unavailable from source contract"}</span><span>OG: {image.ogStatus}</span></div>{image.issues.length > 0 && <p className="mt-2 text-amber-700">Evidence note: {image.issues.join(" ")}</p>}{canReview && <div className="mt-3 flex gap-2"><button disabled={saving === image.id} onClick={() => review("image", image.id, "REVIEW")} className="rounded border px-3 py-1.5 text-xs">Move to review</button><button disabled={saving === image.id} onClick={() => review("image", image.id, "APPROVED")} className="rounded border px-3 py-1.5 text-xs">Approve review</button><button disabled={saving === image.id} onClick={() => review("image", image.id, "DISMISSED")} className="rounded border px-3 py-1.5 text-xs">Dismiss</button></div>}</div>)}{snapshot.images.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No supported image assets found.</p>}</CardContent></Card>}
    {tab === "history" && <Card><CardHeader><CardTitle>Protected change history</CardTitle><CardDescription>Read-only, bounded view of the existing append-only SEO history writer. No edit or delete operation is exposed.</CardDescription></CardHeader><CardContent className="space-y-3">{snapshot.history.map((event) => <div key={event.id} className="grid gap-1 rounded-lg border p-4 text-sm sm:grid-cols-4"><span>{new Date(event.timestamp).toLocaleString()}</span><span>{event.actor} · {event.source}</span><span>{event.entity}:{event.entityId}</span><span>{event.action} {event.field}</span></div>)}{snapshot.history.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No persisted dashboard changes are available.</p>}</CardContent></Card>}
    <p className="text-xs text-muted-foreground">Unavailable signals: {snapshot.unavailable.join("; ")}</p>
  </div>
}
