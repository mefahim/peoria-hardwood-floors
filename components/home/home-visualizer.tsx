import Link from "next/link"
import Image from "next/image"
import { Sparkles, ArrowRight } from "lucide-react"

export function HomeVisualizer() {
  return (
    <section className="bg-secondary">
      <div className="container mx-auto grid items-stretch gap-0 px-6 py-20 lg:grid-cols-2 lg:py-0">
        <div className="flex flex-col justify-center py-4 lg:py-24 lg:pr-16">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent">
            <Sparkles className="h-4 w-4" />
            New — flooring visualizer
          </p>
          <h2 className="font-serif text-3xl leading-tight text-balance md:text-4xl lg:text-5xl">
            See your room with a new floor.
          </h2>
          <p className="mt-5 max-w-lg text-muted-foreground leading-relaxed">
            Answer a few quick questions about your space and style, and our assistant generates a visual concept to help
            you explore directions before we talk. It&apos;s an approximate guide — final color and finish decisions
            always use real samples in your own lighting.
          </p>
          <div className="mt-8">
            <Link
              href="/visualizer"
              className="inline-flex items-center gap-2 bg-foreground px-7 py-4 font-medium text-background transition-transform hover:-translate-y-0.5"
            >
              Try the visualizer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative min-h-[320px] overflow-hidden lg:min-h-[560px]">
          <Image
            src="/images/cta-room.png"
            alt="Living room concept showing new hardwood flooring"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
