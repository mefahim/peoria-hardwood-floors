import { Badge } from "@/components/ui/badge"
import { AdminShell } from "@/app/admin/AdminShell"
import { SeoDashboardClient } from "@/app/admin/seo/SeoDashboardClient"
import { SeoManagementClient } from "@/app/admin/seo/SeoManagementClient"
import { SeoGovernanceClient } from "@/app/admin/seo/SeoGovernanceClient"
import { LocalGovernanceClient } from "@/app/admin/seo/LocalGovernanceClient"
import { Phase07Client } from "@/app/admin/seo/Phase07Client"
import { requireSeoDashboardAccess } from "@/lib/admin/authorization"
import { buildSeoDashboardData } from "@/lib/seo/dashboard"
import { getGovernanceSnapshot } from "@/lib/seo/governance"
import { getLocalSnapshot } from "@/lib/seo/local-management"
import { listManagedSeoEntities } from "@/lib/seo/management"
import { getPhase07Snapshot } from "@/lib/seo/phase07"

export const dynamic = "force-dynamic"

export default async function SeoDashboardPage() {
  const principal = await requireSeoDashboardAccess()
  const data = buildSeoDashboardData()
  const entities = await listManagedSeoEntities()
  const governance = await getGovernanceSnapshot()
  const local = await getLocalSnapshot()
  const phase07 = await getPhase07Snapshot()

  return (
    <AdminShell active="/admin/seo">
      <div className="flex flex-col gap-3 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Protected SEO workspace</p>
          <h1 className="mt-3 font-serif text-3xl">SEO Overview &amp; Audit</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            A read-only view of the existing SEO resolver, content governance, route metadata, and local SEO state. This dashboard does not edit, publish, score, or automatically fix SEO data.
          </p>
        </div>
        <Badge variant="secondary">{principal.role} access</Badge>
      </div>
      <SeoDashboardClient data={data} />
      <div id="pages-services"><SeoManagementClient initialEntities={entities} canEdit={principal.role === "Admin" || principal.role === "SEO Manager"} /></div>
      <div id="topics-content"><SeoGovernanceClient initialSnapshot={governance} role={principal.role ?? "Reviewer"} /></div>
      <div id="content-briefs" className="scroll-mt-24" aria-label="Content briefs are not currently available"><div className="sr-only">Content briefs are not currently available in this dashboard.</div></div>
      <div id="local-seo"><LocalGovernanceClient initialSnapshot={local} role={principal.role ?? "Reviewer"} /></div>
      <div id="case-studies" className="scroll-mt-24" aria-label="Case studies are governed in the local SEO workspace"><div className="sr-only">Case studies are governed in the existing local SEO workspace.</div></div>
      <section className="border-t border-border pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs uppercase tracking-[0.24em] text-accent">Dashboard Phase 07</p><h2 className="mt-3 font-serif text-2xl">Internal Links, Image SEO &amp; Change History</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Governance-only views built on the existing content registry, resolver, authorization, image assets, and append-only history. Accepting a review never mutates public content.</p></div>
          <Badge variant="outline">No auto-publish</Badge>
        </div>
        <div id="internal-links" className="scroll-mt-24"><Phase07Client initialSnapshot={phase07} canReview={principal.role === "Admin" || principal.role === "SEO Manager" || principal.role === "Reviewer"} /></div>
        <div id="image-seo" className="sr-only" aria-label="Image SEO is included in the Phase 07 workspace" />
        <div id="change-history" className="sr-only" aria-label="Change history is included in the Phase 07 workspace" />
      </section>
    </AdminShell>
  )
}
