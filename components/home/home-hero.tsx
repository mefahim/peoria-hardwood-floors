import Link from "next/link"
import Image from "next/image"
import { Phone, ArrowRight } from "lucide-react"
import { site } from "@/lib/site"

export function HomeHero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-foreground">
      <Image
        src="/images/hero-kitchen.png"
        alt="Bright modern kitchen with freshly finished warm oak hardwood floors"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/50 to-transparent" />
      <div className="container relative mx-auto px-6 pt-28 pb-16 text-background">
        <p className="mb-5 text-xs uppercase tracking-[0.3em] text-accent animate-fade-up">
          Family owned · Central Illinois
        </p>
        <h1 className="max-w-3xl font-serif text-4xl leading-[1.03] text-balance animate-fade-up sm:text-5xl lg:text-6xl xl:text-7xl">
          Hardwood floors, crafted and cared for in Peoria.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-background/80 animate-fade-up">
          Installation, sanding &amp; refinishing, custom stains, and durable finishes for homes and businesses across
          Peoria and the surrounding Central Illinois communities.
        </p>
        <div className="mt-9 flex flex-col gap-3 animate-fade-up sm:flex-row sm:items-center">
          <a
            href={site.phoneHref}
            className="inline-flex items-center justify-center gap-2 bg-background px-7 py-4 font-medium text-foreground transition-transform hover:-translate-y-0.5"
          >
            <Phone className="h-4 w-4" />
            {site.phone}
          </a>
          <Link
            href="/estimate-calculator"
            className="inline-flex items-center justify-center gap-2 border border-background/40 px-7 py-4 font-medium text-background transition-colors hover:bg-background/10"
          >
            Get a rough estimate
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
