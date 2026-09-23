"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileCheck2,
  Filter,
  Globe2,
  ImageIcon,
  Link2,
  MapPinned,
  Search,
  ShieldCheck,
  Tags,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AuditCategory, SeoAuditIssue, SeoDashboardData, SeoRouteAudit } from "@/lib/seo/dashboard"

type RouteFilter = "All" | "Indexable" | "Noindex" | "Issues" | "Services" | "Utility" | "Page type"
const routeFilters: RouteFilter[] = ["All", "Indexable", "Noindex", "Issues", "Services", "Utility", "Page type"]
const categories: Array<"All" | AuditCategory> = ["All", "Technical SEO", "Content SEO", "Local SEO", "Structured Data", "Internal Links", "Image SEO"]
const severities = ["All", "critical", "high", "medium", "low", "informational"] as const

function severityVariant(severity: SeoAuditIssue["severity"]): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "critical" || severity === "high") return "destructive"
  if (severity === "medium") return "default"
  return "secondary"
}

function StatusPill({ value }: { value: string }) {
  const positive = ["Passing", "Present", "Available", "Indexable"].includes(value)
  const unavailable = ["Unavailable", "Not audited", "Not applicable", "Noindex"].includes(value)
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${positive ? "bg-emerald-600" : unavailable ? "bg-muted-foreground/50" : "bg-destructive"}`} />{value}</span>
}

function MetricCard({ label, value, icon: Icon, note }: { label: string; value: number | string; icon: typeof Globe2; note?: string }) {
  return <Card className="gap-3 border-border/80 py-5 shadow-none transition-shadow hover:shadow-sm"><CardContent className="flex items-start justify-between gap-4"><div><p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>{note && <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>}</div><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true" /></div></CardContent></Card>
}

function statusFor(data: SeoDashboardData, label: string): { value: string; detail: string; icon: typeof CheckCircle2 } {
  const all = data.routes.length > 0
  const allMetadata = all && data.routes.every((route) => route.titlePresent && route.descriptionPresent)
  const allCanonical = all && data.routes.every((route) => route.canonicalPresent)
  const allSchema = all && data.routes.every((route) => route.schemaStatus !== "Unavailable")
  const internal = !data.routes.some((route) => route.internalLinkStatus === "Issues")
  const content = !data.issues.some((issue) => issue.category === "Content SEO")
  if (label === "Metadata") return { value: allMetadata ? "Passing" : "Issues", detail: allMetadata ? "Title and description signals present" : "One or more route signals need review", icon: allMetadata ? CheckCircle2 : AlertCircle }
  if (label === "Indexability") return { value: all ? "Passing" : "Unavailable", detail: `${data.summary.indexableRoutes} indexable route(s) in the registry`, icon: all ? CheckCircle2 : CircleHelp }
  if (label === "Canonical") return { value: allCanonical ? "Passing" : "Issues", detail: allCanonical ? "Canonical values resolve for audited routes" : "Canonical evidence is incomplete", icon: allCanonical ? CheckCircle2 : AlertCircle }
  if (label === "Structured Data") return { value: allSchema ? "Present" : "Unavailable", detail: allSchema ? "Schema state is available from the current model" : "Schema evidence is unavailable for some routes", icon: allSchema ? CheckCircle2 : CircleHelp }
  if (label === "Internal Linking") return { value: internal ? "Passing" : "Issues", detail: internal ? "No route-level link issue is currently reported" : "Review the flagged internal-link findings", icon: internal ? CheckCircle2 : AlertCircle }
  if (label === "Image SEO") return { value: all ? "Available" : "Unavailable", detail: "Repository-backed page-source signal only", icon: all ? CheckCircle2 : CircleHelp }
  if (label === "Content Governance") return { value: content ? "Passing" : "Issues", detail: content ? "No content governance issue is currently reported" : "Review the content governance findings", icon: content ? CheckCircle2 : AlertCircle }
  return { value: data.summary.localSeoRecords > 0 ? "Present" : "Unavailable", detail: data.summary.localSeoRecords > 0 ? `${data.summary.localSeoRecords} local SEO record(s)` : "No verified local SEO records are connected", icon: data.summary.localSeoRecords > 0 ? CheckCircle2 : CircleHelp }
}

function HealthCard({ data, label, icon: Icon }: { data: SeoDashboardData; label: string; icon: typeof Globe2 }) {
  const status = statusFor(data, label)
  const StatusIcon = status.icon
  return <Card className="gap-4 border-border/80 py-5 shadow-none"><CardContent><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true" /></div><p className="text-sm font-medium">{label}</p></div><StatusIcon className={`h-4 w-4 ${status.value === "Issues" ? "text-destructive" : status.value === "Unavailable" ? "text-muted-foreground" : "text-emerald-600"}`} aria-hidden="true" /></div><div className="mt-4"><StatusPill value={status.value} /><p className="mt-2 text-xs leading-5 text-muted-foreground">{status.detail}</p></div></CardContent></Card>
}

function issueHref(issue: SeoAuditIssue): string {
  if (issue.category === "Internal Links") return "/admin/seo#internal-links"
  if (issue.category === "Local SEO") return "/admin/seo#local-seo"
  if (issue.category === "Image SEO") return "/admin/seo#image-seo"
  if (issue.category === "Content SEO") return "/admin/seo#topics-content"
  return "/admin/seo#pages-services"
}

function RouteRow({ route }: { route: SeoRouteAudit }) {
  return <tr className="border-b border-border align-top last:border-0"><td className="px-4 py-4 font-mono text-xs text-foreground">{route.route}</td><td className="px-4 py-4"><Badge variant="outline">{route.pageType}</Badge></td><td className="px-4 py-4"><StatusPill value={route.indexable ? "Indexable" : "Noindex"} /></td><td className="px-4 py-4"><StatusPill value={route.titlePresent ? "Present" : "Missing"} /></td><td className="px-4 py-4"><StatusPill value={route.descriptionPresent ? "Present" : "Missing"} /></td><td className="px-4 py-4"><StatusPill value={route.canonicalPresent ? "Present" : "Missing"} /></td><td className="px-4 py-4"><StatusPill value={route.schemaStatus} /></td><td className="px-4 py-4"><StatusPill value={route.internalLinkStatus} /></td><td className="px-4 py-4 text-right font-medium">{route.issueCount}</td></tr>
}

function IssueRow({ issue }: { issue: SeoAuditIssue }) {
  return <details className="group border-b border-border last:border-0"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><span className="flex min-w-0 items-start gap-3"><ChevronDown className="mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /><span className="min-w-0"><span className="block font-medium leading-5">{issue.description}</span><span className="mt-1 block text-xs text-muted-foreground">{issue.route} · {issue.category} · {issue.source}</span></span></span><Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge></summary><div className="grid gap-3 bg-secondary/30 px-11 pb-5 pr-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence</p><p className="mt-1">{issue.evidence}</p></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended action</p><p className="mt-1">{issue.recommendedAction}</p><Link href={issueHref(issue)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent underline-offset-4 hover:underline">Open relevant section <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p><p className="mt-1">{issue.status}</p></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detected</p><p className="mt-1">{issue.detectedAt}</p></div></div></details>
}

export function SeoDashboardClient({ data }: { data: SeoDashboardData }) {
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("All")
  const [routeSearch, setRouteSearch] = useState("")
  const [issueSearch, setIssueSearch] = useState("")
  const [category, setCategory] = useState<(typeof categories)[number]>("All")
  const [severity, setSeverity] = useState<(typeof severities)[number]>("All")

  const visibleRoutes = useMemo(() => data.routes.filter((route) => {
    const matchesFilter = routeFilter === "All" || routeFilter === "Indexable" && route.indexable || routeFilter === "Noindex" && !route.indexable || routeFilter === "Issues" && route.issueCount > 0 || routeFilter === "Services" && route.pageType === "service" || routeFilter === "Utility" && route.pageType === "utility" || routeFilter === "Page type" && route.pageType !== "public route"
    return matchesFilter && route.route.toLowerCase().includes(routeSearch.toLowerCase())
  }), [data.routes, routeFilter, routeSearch])
  const visibleIssues = data.issues.filter((issue) => (category === "All" || issue.category === category) && (severity === "All" || issue.severity === severity) && `${issue.route} ${issue.description}`.toLowerCase().includes(issueSearch.toLowerCase()))
  const metrics = [
    ["Indexable public routes", data.summary.indexableRoutes, Globe2],
    ["Noindex utility routes", data.summary.noindexRoutes, ShieldCheck],
    ["Services", data.summary.services, Tags],
    ["Content records", data.summary.contentRecords, FileCheck2],
    ["Verified case studies", data.summary.verifiedCaseStudies, FileCheck2],
    ["Local SEO records", data.summary.localSeoRecords, MapPinned],
    ["Audit issues", data.summary.auditIssues, AlertCircle],
    ["Passing checks", data.summary.passingChecks, CheckCircle2],
  ] as const
  const health = [["Metadata", FileCheck2], ["Indexability", ShieldCheck], ["Canonical", Globe2], ["Structured Data", Tags], ["Internal Linking", Link2], ["Image SEO", ImageIcon], ["Content Governance", FileCheck2], ["Local SEO", MapPinned]] as const

  return <div className="space-y-10">
    <section id="seo-overview" aria-labelledby="overview-heading" className="scroll-mt-24">
      <div className="flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Verified SEO state</p><h2 id="overview-heading" className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">SEO Overview</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">A production workspace for reviewing metadata, indexability, content governance, local signals, and route-level SEO evidence. This view is read-only and derived from the existing systems.</p></div><div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />Runtime-derived · No auto-publish</div></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value, icon]) => <MetricCard key={label} label={label} value={value} icon={icon} />)}</div>
    </section>

    <section aria-labelledby="health-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">System status</p><h2 id="health-heading" className="mt-2 text-xl font-semibold tracking-tight">SEO health signals</h2><p className="mt-1 text-sm text-muted-foreground">Evidence-backed status only. No aggregate SEO score is calculated.</p></div><Badge variant="secondary">{data.summary.passingChecks} passing checks</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{health.map(([label, icon]) => <HealthCard key={label} data={data} label={label} icon={icon} />)}</div></section>

    <section aria-labelledby="issues-heading"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Action queue</p><h2 id="issues-heading" className="mt-2 text-xl font-semibold tracking-tight">Key issues</h2><p className="mt-1 text-sm text-muted-foreground">Expandable, read-only findings from the current route and governance models.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Filter className="h-4 w-4" aria-hidden="true" />{visibleIssues.length} shown</div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm sm:col-span-1"><span className="sr-only">Search issues</span><span className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><input value={issueSearch} onChange={(event) => setIssueSearch(event.target.value)} placeholder="Search issues" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></span></label><label className="text-sm"><span className="sr-only">Filter issues by category</span><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm"><span className="sr-only">Filter issues by severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="h-10 w-full rounded-md border border-input bg-background px-3 capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring">{severities.map((item) => <option key={item}>{item}</option>)}</select></label></div><Card className="mt-4 overflow-hidden py-0"><CardContent className="p-0">{visibleIssues.length ? visibleIssues.map((issue) => <IssueRow key={issue.id} issue={issue} />) : <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" aria-hidden="true" /><p className="mt-3 text-sm font-medium">No issues match these filters</p><p className="mt-1 text-xs text-muted-foreground">The current runtime model has no additional findings for this view.</p></div>}</CardContent></Card></section>

    <section aria-labelledby="routes-heading"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Evidence register</p><h2 id="routes-heading" className="mt-2 text-xl font-semibold tracking-tight">Route audit</h2><p className="mt-1 text-sm text-muted-foreground">Route-level metadata, canonical, schema, internal-link, and issue state from the existing audit builder.</p></div><div className="text-xs text-muted-foreground">{visibleRoutes.length} of {data.routes.length} routes</div></div><div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><label className="relative block w-full lg:max-w-sm"><span className="sr-only">Search routes</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><input value={routeSearch} onChange={(event) => setRouteSearch(event.target.value)} placeholder="Search routes" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label><div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Route filters">{routeFilters.map((item) => <button key={item} type="button" onClick={() => setRouteFilter(item)} aria-pressed={routeFilter === item} className={`whitespace-nowrap rounded-md border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${routeFilter === item ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-secondary"}`}>{item}</button>)}</div></div><Card className="mt-4 overflow-hidden py-0"><CardHeader className="border-b border-border bg-secondary/20 py-5"><CardTitle className="text-base">{visibleRoutes.length} routes in view</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[1050px] text-left text-sm"><caption className="sr-only">SEO route audit table</caption><thead className="border-b border-border bg-secondary/40 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr>{["Route", "Page type", "Indexability", "Title", "Description", "Canonical", "Schema", "Internal links", "Issues"].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{visibleRoutes.length ? visibleRoutes.map((route) => <RouteRow key={route.route} route={route} />) : <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">No routes match the current filters.</td></tr>}</tbody></table></CardContent></Card></section>

    <section aria-labelledby="unavailable-heading" className="rounded-lg border border-border bg-secondary/20 p-5 sm:p-6"><div className="flex items-start gap-3"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><h2 id="unavailable-heading" className="text-sm font-semibold">Data boundaries</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{data.unavailable.join(", ")} are <strong className="font-medium text-foreground">Not connected</strong>. They are not estimated, scored, or fabricated.</p></div></div></section>
  </div>
}
