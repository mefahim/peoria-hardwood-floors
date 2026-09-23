"use client"

import { useMemo, useState } from "react"
import { ChevronDown, Filter, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

function Status({ value }: { value: string }) {
  return <span className="inline-flex items-center gap-1.5 text-xs"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${value === "Issues" ? "bg-destructive" : value === "Passing" || value === "Present" ? "bg-emerald-600" : "bg-muted-foreground"}`} />{value}</span>
}

function RouteRow({ route }: { route: SeoRouteAudit }) {
  return <tr className="border-b border-border align-top last:border-0">
    <td className="px-4 py-4 font-mono text-xs">{route.route}</td>
    <td className="px-4 py-4"><Badge variant="outline">{route.pageType}</Badge></td>
    <td className="px-4 py-4"><Status value={route.indexable ? "Indexable" : "Noindex"} /></td>
    <td className="px-4 py-4"><Status value={route.titlePresent ? "Present" : "Missing"} /></td>
    <td className="px-4 py-4"><Status value={route.descriptionPresent ? "Present" : "Missing"} /></td>
    <td className="px-4 py-4"><Status value={route.canonicalPresent ? "Present" : "Missing"} /></td>
    <td className="px-4 py-4"><Status value={route.schemaStatus} /></td>
    <td className="px-4 py-4"><Status value={route.internalLinkStatus} /></td>
    <td className="px-4 py-4 text-right font-medium">{route.issueCount}</td>
  </tr>
}

function IssueRow({ issue }: { issue: SeoAuditIssue }) {
  return <details className="group border-b border-border last:border-0">
    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <span className="flex min-w-0 items-start gap-3"><ChevronDown className="mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /><span className="min-w-0"><span className="block font-medium">{issue.description}</span><span className="mt-1 block text-xs text-muted-foreground">{issue.route} · {issue.category} · {issue.source}</span></span></span>
      <Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge>
    </summary>
    <div className="grid gap-3 bg-secondary/30 px-11 pb-5 pr-4 text-sm sm:grid-cols-2">
      <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence</p><p className="mt-1">{issue.evidence}</p></div>
      <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended action</p><p className="mt-1">{issue.recommendedAction}</p></div>
      <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p><p className="mt-1">{issue.status}</p></div>
      <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detected</p><p className="mt-1">{issue.detectedAt}</p></div>
    </div>
  </details>
}

export function SeoDashboardClient({ data }: { data: SeoDashboardData }) {
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("All")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<(typeof categories)[number]>("All")
  const [severity, setSeverity] = useState<(typeof severities)[number]>("All")

  const visibleRoutes = useMemo(() => data.routes.filter((route) => {
    const matchesFilter = routeFilter === "All" || routeFilter === "Indexable" && route.indexable || routeFilter === "Noindex" && !route.indexable || routeFilter === "Issues" && route.issueCount > 0 || routeFilter === "Services" && route.pageType === "service" || routeFilter === "Utility" && route.pageType === "utility" || routeFilter === "Page type" && route.pageType !== "public route"
    return matchesFilter && route.route.toLowerCase().includes(search.toLowerCase())
  }), [data.routes, routeFilter, search])
  const visibleIssues = data.issues.filter((issue) => (category === "All" || issue.category === category) && (severity === "All" || issue.severity === severity) && `${issue.route} ${issue.description}`.toLowerCase().includes(search.toLowerCase()))

  return <>
    <section aria-labelledby="summary-heading" className="mt-8">
      <div className="flex items-center justify-between gap-4"><div><h2 id="summary-heading" className="text-lg font-medium">SEO overview</h2><p className="mt-1 text-sm text-muted-foreground">Runtime-derived facts from the existing resolver and governance systems.</p></div><Badge>Read only</Badge></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[[data.summary.indexableRoutes, "Indexable routes"], [data.summary.noindexRoutes, "Noindex utility routes"], [data.summary.services, "Services"], [data.summary.auditIssues, "Audit issues"]].map(([value, label]) => <Card key={label}><CardContent className="pt-6"><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></CardContent></Card>)}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[[data.summary.contentRecords, "Content records"], [data.summary.verifiedCaseStudies, "Verified case studies"], [data.summary.localSeoRecords, "Local SEO records"], [data.summary.passingChecks, "Passing checks"]].map(([value, label]) => <Card key={label}><CardContent className="pt-5"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></CardContent></Card>)}
      </div>
    </section>

    <section aria-labelledby="audit-heading" className="mt-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="audit-heading" className="text-lg font-medium">Audit issues</h2><p className="mt-1 text-sm text-muted-foreground">Expandable, read-only findings. No automatic fixes or workflow mutations are available.</p></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4" aria-hidden="true" />{visibleIssues.length} shown</div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm"><span className="sr-only">Search routes and issues</span><span className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search routes or issues" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></span></label><label className="text-sm"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm"><span className="sr-only">Filter by severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="h-10 w-full rounded-md border border-input bg-background px-3 capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring">{severities.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <Card className="mt-4 overflow-hidden"><CardContent className="p-0">{visibleIssues.length ? visibleIssues.map((issue) => <IssueRow key={issue.id} issue={issue} />) : <div className="p-8 text-center text-sm text-muted-foreground">No audit findings match the current filters.</div>}</CardContent></Card>
    </section>

    <section aria-labelledby="routes-heading" className="mt-10"><div><h2 id="routes-heading" className="text-lg font-medium">Route audit</h2><p className="mt-1 text-sm text-muted-foreground">Every row is derived from the route registry, metadata resolver, and existing content records.</p></div><div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Route filters">{routeFilters.map((item) => <button key={item} type="button" onClick={() => setRouteFilter(item)} aria-pressed={routeFilter === item} className={`rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${routeFilter === item ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-secondary"}`}>{item}</button>)}</div>
      <Card className="mt-4 overflow-hidden"><CardHeader><CardTitle className="text-base">{visibleRoutes.length} routes</CardTitle><CardDescription>Indexability and evidence-backed SEO signals. Color is supplemented by text labels.</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[1050px] text-left text-sm"><caption className="sr-only">SEO route audit table</caption><thead className="border-y border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Route", "Page type", "Indexability", "Title", "Description", "Canonical", "Schema", "Internal links", "Issues"].map((heading) => <th key={heading} scope="col" className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{visibleRoutes.length ? visibleRoutes.map((route) => <RouteRow key={route.route} route={route} />) : <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No routes match the current filters.</td></tr>}</tbody></table></CardContent></Card>
    </section>

    <section aria-labelledby="unavailable-heading" className="mt-10 border border-border bg-secondary/30 p-6"><h2 id="unavailable-heading" className="text-lg font-medium">Unavailable data</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{data.unavailable.join(", ")} are <strong className="font-medium text-foreground">Not connected yet</strong>. They are not estimated or fabricated.</p></section>
  </>
}
