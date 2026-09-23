"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Info,
  RotateCcw,
  Save,
  Search,
  Server,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ManagedSeoEntity } from "@/lib/seo/management"

type Kind = "page" | "service"
type StatusFilter = "All" | "Inherited" | "Override" | "Issues"

function effectiveValue(entity: ManagedSeoEntity, field: "title" | "description") {
  return entity.override?.[field] ?? entity[`fallback${field[0].toUpperCase()}${field.slice(1)}` as "fallbackTitle" | "fallbackDescription"]
}

function StatusBadge({ entity }: { entity: ManagedSeoEntity }) {
  return <Badge variant={entity.override ? "default" : "secondary"}>{entity.override ? "Explicit override" : "Inherited"}</Badge>
}

function FieldState({ overridden }: { overridden: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 text-xs ${overridden ? "text-accent" : "text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${overridden ? "bg-accent" : "bg-muted-foreground/50"}`} aria-hidden="true" />{overridden ? "Explicit override" : "Inherited from default"}</span>
}

export function SeoManagementClient({ initialEntities, canEdit }: { initialEntities: ManagedSeoEntity[]; canEdit: boolean }) {
  const [entities, setEntities] = useState(initialEntities)
  const [kind, setKind] = useState<Kind>("page")
  const [search, setSearch] = useState("")
  const [pageType, setPageType] = useState("All")
  const [status, setStatus] = useState<StatusFilter>("All")
  const [selectedRoute, setSelectedRoute] = useState(initialEntities.find((entity) => entity.entity === "page")?.route ?? initialEntities[0]?.route ?? "")
  const [title, setTitle] = useState(initialEntities.find((entity) => entity.entity === "page")?.title ?? "")
  const [description, setDescription] = useState(initialEntities.find((entity) => entity.entity === "page")?.description ?? "")
  const [editing, setEditing] = useState(false)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const selected = entities.find((entity) => entity.route === selectedRoute) ?? null
  const effectiveTitle = selected ? effectiveValue(selected, "title") : ""
  const effectiveDescription = selected ? effectiveValue(selected, "description") : ""
  const dirty = Boolean(selected && (title !== effectiveTitle || description !== effectiveDescription))
  const titleError = editing && !title.trim() ? "SEO title cannot be empty." : editing && title.length > 160 ? "SEO title must be 160 characters or fewer." : null
  const descriptionError = editing && !description.trim() ? "Meta description cannot be empty." : editing && description.length > 320 ? "Meta description must be 320 characters or fewer." : null
  const formError = titleError || descriptionError

  const pageTypes = useMemo(() => ["All", ...Array.from(new Set(entities.filter((entity) => entity.entity === kind).map((entity) => entity.pageType)))], [entities, kind])
  const visible = useMemo(() => entities.filter((entity) => {
    if (entity.entity !== kind) return false
    const needle = search.toLowerCase()
    const matchesSearch = `${entity.route} ${entity.name} ${entity.title}`.toLowerCase().includes(needle)
    const matchesType = pageType === "All" || entity.pageType === pageType
    const matchesStatus = status === "All" || status === "Inherited" && !entity.override || status === "Override" && Boolean(entity.override) || status === "Issues" && entity.issueCount > 0
    return matchesSearch && matchesType && matchesStatus
  }), [entities, kind, pageType, search, status])

  function syncDraft(entity: ManagedSeoEntity) {
    setTitle(effectiveValue(entity, "title")); setDescription(effectiveValue(entity, "description")); setEditing(false); setFeedback(null)
  }
  function selectEntity(route: string) {
    const next = entities.find((entity) => entity.route === route)
    if (!next) return
    setSelectedRoute(route); syncDraft(next); setMobileDetail(true)
  }
  function switchKind(nextKind: Kind) {
    setKind(nextKind); setPageType("All"); setStatus("All")
    const first = entities.find((entity) => entity.entity === nextKind)
    if (first) { setSelectedRoute(first.route); syncDraft(first) }
  }
  function beginEdit() { if (!selected || !canEdit) return; setTitle(effectiveTitle); setDescription(effectiveDescription); setEditing(true); setFeedback(null) }
  async function save(action: "set" | "reset") {
    if (!selected || !canEdit || saving || action === "set" && (!dirty || Boolean(formError))) return
    setSaving(true); setFeedback(null)
    try {
      const response = await fetch("/api/admin/seo/management", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ route: selected.route, action, ...(action === "set" ? { fields: { title, description } } : {}) }) })
      const payload = await response.json() as { ok?: boolean; data?: { entity?: ManagedSeoEntity }; errors?: { message?: string }[] }
      if (!response.ok || !payload.ok || !payload.data?.entity) throw new Error(payload.errors?.[0]?.message ?? "Unable to save SEO settings.")
      setEntities((current) => current.map((entity) => entity.route === selected.route ? payload.data!.entity! : entity))
      syncDraft(payload.data.entity)
      setFeedback({ type: "success", message: action === "reset" ? "Reset complete. The default values are active." : "Override saved. The effective SEO values are updated." })
    } catch (error) { setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to save SEO settings." }) } finally { setSaving(false) }
  }

  const list = <Card className={`overflow-hidden border-border/80 py-0 lg:block ${mobileDetail ? "hidden" : "block"}`}><CardHeader className="border-b border-border bg-secondary/20 py-5"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{kind === "page" ? "Public pages" : "Existing services"}</CardTitle><CardDescription className="mt-1">Select an entity to inspect its effective SEO state.</CardDescription></div><Badge variant="outline">{visible.length} shown</Badge></div><div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="SEO entity type"><button type="button" role="tab" aria-selected={kind === "page"} onClick={() => switchKind("page")} className={`rounded-md border px-3 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${kind === "page" ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-secondary"}`}>Pages ({entities.filter((entity) => entity.entity === "page").length})</button><button type="button" role="tab" aria-selected={kind === "service"} onClick={() => switchKind("service")} className={`rounded-md border px-3 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${kind === "service" ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-secondary"}`}>Services ({entities.filter((entity) => entity.entity === "service").length})</button></div><label className="relative mt-2 block"><span className="sr-only">Search {kind}s by route or title</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${kind}s by route or title`} className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label><div className="grid grid-cols-2 gap-2"><label className="sr-only" htmlFor="seo-page-type">Page type</label><select id="seo-page-type" value={pageType} onChange={(event) => setPageType(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring">{pageTypes.map((item) => <option key={item}>{item}</option>)}</select><label className="sr-only" htmlFor="seo-status-filter">Override status</label><select id="seo-status-filter" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-9 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring">{["All", "Inherited", "Override", "Issues"].map((item) => <option key={item}>{item}</option>)}</select></div></CardHeader><CardContent className="max-h-[680px] overflow-y-auto p-0">{visible.map((entity) => <button type="button" key={entity.route} onClick={() => selectEntity(entity.route)} aria-pressed={selected?.route === entity.route} className={`block w-full border-t border-border px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${selected?.route === entity.route ? "bg-secondary" : "hover:bg-secondary/60"}`}><span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block truncate font-medium">{entity.name}</span><span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">{entity.route}</span></span><StatusBadge entity={entity} /></span><span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{entity.pageType}</span><span>{entity.indexable ? "Indexable" : "Noindex"}</span><span>{entity.issueCount} issues</span></span></button>)}{!visible.length && <div className="p-8 text-center text-sm text-muted-foreground">No entities match these filters.</div>}</CardContent></Card>

  const detail = selected ? <Card className={`border-border/80 py-0 lg:block ${mobileDetail ? "block" : "hidden"}`}><CardHeader className="border-b border-border bg-secondary/20 py-5"><div className="flex items-start gap-3"><button type="button" onClick={() => setMobileDetail(false)} className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden" aria-label="Back to SEO entity list"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-base">{selected.name}</CardTitle><StatusBadge entity={selected} /></div><CardDescription className="mt-1 break-all font-mono text-xs">{selected.route}</CardDescription><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{selected.pageType}</Badge><Badge variant={selected.indexable ? "default" : "secondary"}>{selected.indexable ? "Indexable" : "Noindex"}</Badge><Badge variant={selected.issueCount ? "destructive" : "secondary"}>{selected.issueCount} issues</Badge></div></div></div></CardHeader><CardContent className="space-y-7 py-6">
    <section aria-labelledby="preview-heading" className="rounded-lg border border-border bg-[#f8fafc] p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Eye className="h-4 w-4" aria-hidden="true" />Preview</div><Badge variant="outline">Not Google rendering</Badge></div><div className="mt-5 max-w-2xl"><h3 id="preview-heading" className="text-xl leading-6 text-[#1a0dab]">{editing ? title || "Untitled page" : effectiveTitle}</h3><p className="mt-1 truncate font-mono text-xs text-[#16803c]">https://peoriahardwoodfloors.com{selected.route}</p><p className="mt-2 text-sm leading-5 text-[#4d5156]">{editing ? description || "No meta description" : effectiveDescription}</p></div><p className="mt-5 text-[11px] text-muted-foreground">Preview only; this does not claim to represent actual Google rendering.</p></section>
    <section aria-labelledby="editor-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Supported fields</p><h3 id="editor-heading" className="mt-1 text-lg font-semibold">Metadata editor</h3><p className="mt-1 text-sm text-muted-foreground">Only SEO title and meta description can be changed.</p></div>{editing && <Badge variant={dirty ? "default" : "secondary"}>{dirty ? "Unsaved changes" : "No changes"}</Badge>}</div>{!editing ? <div className="mt-4 flex flex-wrap items-center gap-2"><button type="button" onClick={beginEdit} disabled={!canEdit} className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Save className="h-4 w-4" aria-hidden="true" />{canEdit ? "Edit supported fields" : "Read only"}</button>{selected.override && <button type="button" onClick={() => save("reset")} disabled={!canEdit || saving} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset to inherited</button>}</div> : <div className="mt-4 space-y-5"><div><div className="flex items-center justify-between gap-3"><label htmlFor="seo-title" className="text-sm font-medium">SEO title</label><span className={`text-xs ${title.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>{title.length}/160</span></div><input id="seo-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} aria-invalid={Boolean(titleError)} aria-describedby={titleError ? "seo-title-error" : "seo-title-state"} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />{titleError ? <p id="seo-title-error" className="mt-1 text-xs text-destructive" role="alert">{titleError}</p> : <p id="seo-title-state" className="mt-1"><FieldState overridden={Boolean(selected.override?.title)} /></p>}</div><div><div className="flex items-center justify-between gap-3"><label htmlFor="seo-description" className="text-sm font-medium">Meta description</label><span className={`text-xs ${description.length > 320 ? "text-destructive" : "text-muted-foreground"}`}>{description.length}/320</span></div><textarea id="seo-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={340} rows={5} aria-invalid={Boolean(descriptionError)} aria-describedby={descriptionError ? "seo-description-error" : "seo-description-state"} className="mt-2 w-full resize-y rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />{descriptionError ? <p id="seo-description-error" className="mt-1 text-xs text-destructive" role="alert">{descriptionError}</p> : <p id="seo-description-state" className="mt-1"><FieldState overridden={Boolean(selected.override?.description)} /></p>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => save("set")} disabled={saving || !canEdit || !dirty || Boolean(formError)} className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Save className="h-4 w-4" aria-hidden="true" />{saving ? "Saving…" : "Save override"}</button><button type="button" onClick={() => selected && syncDraft(selected)} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>{selected.override && <button type="button" onClick={() => save("reset")} disabled={saving || !canEdit} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset to inherited</button>}</div></div>}{feedback && <p role="status" className={`flex items-start gap-2 text-sm ${feedback.type === "success" ? "text-emerald-700" : "text-destructive"}`}><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{feedback.message}</p>}</section>
    <section aria-labelledby="readonly-heading"><div className="flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><h3 id="readonly-heading" className="text-sm font-semibold">Read-only SEO information</h3></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-border bg-secondary/20 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Technical state</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Canonical</dt><dd className="max-w-[65%] break-all text-right font-mono text-xs">{selected.canonical}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Indexability</dt><dd><StatusBadge entity={{ ...selected, override: null }} /></dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Schema</dt><dd>{selected.indexable ? "Available" : "Not applicable"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Internal links</dt><dd>{selected.internalLinkStatus}</dd></div></dl></div><div className="rounded-md border border-border bg-secondary/20 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Governance context</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Page purpose</dt><dd className="text-right">{selected.pagePurpose ?? "Unavailable"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Search intent</dt><dd className="text-right">{selected.searchIntent ?? "Unavailable"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Topics</dt><dd className="max-w-[65%] text-right">{[selected.primaryTopic, ...selected.secondaryTopics].filter(Boolean).join(", ") || "Unavailable"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Local relevance</dt><dd className="text-right">{selected.localRelevance}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Service identity</dt><dd className="text-right">{selected.entity === "service" ? "Authoritative service record" : "Public page record"}</dd></div></dl></div></div></section>
    <div className="flex items-start gap-2 rounded-md border border-border p-3 text-xs leading-5 text-muted-foreground"><Server className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Server-side validation remains authoritative. The editor can only submit title and description through the existing protected API.</div>
  </CardContent></Card> : <Card className="hidden border-border/80 lg:block"><CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground"><Sparkles className="h-6 w-6" aria-hidden="true" /><p className="mt-3">Select a page or service to open its SEO workspace.</p></CardContent></Card>

  return <section aria-labelledby="management-heading" className="mt-10 scroll-mt-24 border-t border-border pt-10" id="pages-services"><div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Management workspace</p><h2 id="management-heading" className="mt-2 font-serif text-2xl tracking-tight">Pages &amp; Services</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Manage explicit title and description overrides while keeping canonical, indexability, governance, and service identity controlled by their existing source systems.</p></div><Badge variant={canEdit ? "default" : "secondary"}>{canEdit ? "Editing enabled" : "Read only"}</Badge></div><div className="mt-6 grid gap-4 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.35fr)]">{list}{detail}</div></section>
}
