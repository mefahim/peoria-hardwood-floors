import { metadataForPath } from "@/lib/seo/resolver"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { CtaBand } from "@/components/cta-band"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/pricing")

const services = [
  ["Installation", "Material, layout, subfloor preparation, trim, and installation method all shape the final range."],
  ["Sanding & refinishing", "Room count, repairs, stain selection, finish system, and the existing floor's condition matter most."],
  ["Sandless refinishing", "A lower-disruption refresh for floors with a sound existing finish and surface-level wear."],
  ["Deck & cabinet refinishing", "Exterior prep, board condition, cabinet count, color changes, and finish choice affect the scope."],
]

export default function PricingPage() {
  return <>
    <StructuredData graph={buildPageEntityGraph("/pricing", [{ label: "Home", href: "/" }, { label: "Pricing", href: "/pricing" }])} />
    <PageHero eyebrow="Pricing guidance" title="A clear conversation before the work begins." description="Every floor is different. We prefer to look at the space, understand the scope, and give you a useful estimate instead of hiding behind a one-size-fits-all price." image="/images/new-images/IMG_0214.jpg" imageAlt="Refinished hardwood floor with warm natural light" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Pricing", href: "/pricing" }]} />
    <main>
      <section className="container mx-auto grid gap-12 px-6 py-20 lg:grid-cols-[.85fr_1.15fr] lg:py-28">
        <div><p className="text-xs uppercase tracking-[0.24em] text-accent">What affects cost</p><h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">Good pricing starts with the right questions.</h2><p className="mt-6 leading-relaxed text-muted-foreground">Square footage is only part of the story. We account for preparation, materials, access, details, and the finish you want so the recommendation fits the project—not just a calculator.</p><Link href="/estimate-calculator" className="mt-8 inline-flex items-center gap-2 bg-foreground px-6 py-3 font-medium text-background">Try the estimate calculator <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="divide-y divide-border border-y border-border">{services.map(([title, body]) => <article key={title} className="py-7"><h3 className="font-serif text-2xl">{title}</h3><p className="mt-2 leading-relaxed text-muted-foreground">{body}</p></article>)}</div>
      </section>
      <section className="bg-secondary"><div className="container mx-auto grid gap-10 px-6 py-20 lg:grid-cols-2 lg:py-24"><div><p className="text-xs uppercase tracking-[0.24em] text-accent">Our promise</p><h2 className="mt-4 font-serif text-3xl md:text-4xl">No surprises. No pressure.</h2></div><ul className="space-y-4 text-muted-foreground">{["A clear scope before scheduling", "Material and finish options explained in plain language", "Recommendations based on your home, business, and budget", "A local team serving Peoria and Central Illinois"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{item}</li>)}</ul></div></section>
    </main><CtaBand />
  </>
}
