import Link from "next/link"
import { ClipboardList, FileCheck2, History, ImageIcon, Link2, MapPinned, Network, Tags } from "lucide-react"

const ITEMS = [
  ["#topics-content", "Topics", Tags],
  ["#content-opportunities", "Content Opportunities", Network],
  ["#content-briefs", "Content Briefs", ClipboardList],
  ["#local-seo", "Local SEO", MapPinned],
  ["#case-studies", "Case Studies", FileCheck2],
  ["#internal-links", "Internal Links", Link2],
  ["#image-seo", "Image SEO", ImageIcon],
  ["#change-history", "Change History", History],
] as const

export function GovernanceWorkspaceNav() {
  return <nav aria-label="SEO governance workspace sections" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{ITEMS.map(([href, label, Icon]) => <Link key={href} href={`/admin/seo${href}`} className="group flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-accent/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-accent"><Icon className="h-4 w-4" aria-hidden="true" /></span><span>{label}</span></Link>)}</nav>
}
