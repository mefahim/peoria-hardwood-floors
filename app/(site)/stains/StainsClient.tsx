"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { stains } from "@/lib/site"

export default function StainsPage() {
  const [filter, setFilter] = useState("All")
  const tones = ["All", "Natural", "Warm", "Gray", "Dark"]
  const visible = filter === "All" ? stains : stains.filter((stain) => stain.tone === filter)
  return <><PageHero eyebrow="Color direction" title="Start with a tone. Finish with a sample." description="Explore stain directions we work with, then narrow the choice with real samples on your actual wood." image="/images/finish-oil.png" imageAlt="Warm stained hardwood floor" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Stains", href: "/stains" }]} /><main className="container mx-auto px-6 py-20 lg:py-28"><div className="flex flex-wrap gap-2 border-b border-border pb-8">{tones.map((tone) => <button key={tone} onClick={() => setFilter(tone)} className={`px-5 py-3 text-sm transition-colors ${filter === tone ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-muted"}`}>{tone}</button>)}</div><div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">{visible.map((stain) => <article key={stain.name}><div className="aspect-[3/2]" style={{ backgroundColor: stain.color }} /><div className="mt-4 flex items-start justify-between gap-3"><div><h2 className="font-serif text-xl">{stain.name}</h2><p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">{stain.brand} · {stain.tone}</p></div></div></article>)}</div><p className="mt-16 max-w-2xl border-l-2 border-accent pl-5 text-sm leading-relaxed text-muted-foreground">Stain chips are directional only. Final color varies with wood species, age, preparation, application, and lighting. We recommend choosing from samples made for your floor.</p><div className="mt-10"><Link href="/contact" className="inline-flex items-center gap-2 bg-foreground px-7 py-4 font-medium text-background">Request a sample conversation <ArrowRight className="h-4 w-4" /></Link></div></main></>
}

  
