import { metadataForPath } from "@/lib/seo/resolver"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { CtaBand } from "@/components/cta-band"
import { finishes } from "@/lib/site"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/finishes")

export default function FinishesPage() {
  return <>
    <StructuredData graph={buildPageEntityGraph("/finishes", [{ label: "Home", href: "/" }, { label: "Finishes", href: "/finishes" }])} />
    <PageHero eyebrow="The final layer" title="Finish is where the floor becomes yours." description="We help you compare sheen, durability, maintenance, and the feel you want underfoot — then recommend the right system for your space." image="/images/finish-water.png" imageAlt="Waterborne finish on hardwood floor" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Finishes", href: "/finishes" }]} />
    <main>
      <section className="container mx-auto px-6 py-20 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-3">
          {finishes.map((finish) => <article key={finish.name} className="border border-border bg-card">
            <div className="relative aspect-[4/3]"><Image src={finish.image} alt={`${finish.name} hardwood floor finish`} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" /></div>
            <div className="p-7">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">{finish.family}</p><h2 className="mt-3 font-serif text-2xl">{finish.name}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{finish.notes}</p>
              <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Sheen</dt><dd className="text-right">{finish.sheen}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Best for</dt><dd className="max-w-[12rem] text-right">{finish.bestFor}</dd></div></dl>
            </div>
          </article>)}
        </div>
      </section>
      <section className="bg-secondary"><div className="container mx-auto grid gap-10 px-6 py-20 lg:grid-cols-2 lg:py-24"><div><p className="text-xs uppercase tracking-[0.2em] text-accent">A better decision</p><h2 className="mt-3 font-serif text-3xl">See samples in your own light.</h2></div><div className="space-y-4 text-muted-foreground leading-relaxed"><p>Screen colors and online photos are useful for direction, but they cannot show exactly how a finish will look in your home. We bring the conversation back to real samples, your wood species, and your lighting.</p><ul className="space-y-2">{["Compare sheen without guesswork", "Understand cure and maintenance needs", "Choose a finish that fits your everyday life"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{item}</li>)}</ul><Link href="/contact" className="inline-flex items-center gap-2 pt-3 font-medium text-foreground">Talk through your finish <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    </main><CtaBand />
  </>
}

// Finish appearance varies by wood species, lighting, application, and screen settings.

/**/ 
  
