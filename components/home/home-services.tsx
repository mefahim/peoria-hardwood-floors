import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { services } from "@/lib/site"
import { SectionHeading } from "@/components/section-heading"

export function HomeServices() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-20 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="What we do"
            title="Six ways we care for wood"
            description="Separate expertise for every kind of project — each done to the same high standard."
          />
          <Link
            href="/services"
            className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-foreground underline-offset-4 hover:underline"
          >
            All services
            <ArrowUpRight className="h-4 w-4 text-accent" />
          </Link>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group relative flex flex-col bg-background transition-colors hover:bg-secondary"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={s.image || "/placeholder.svg"}
                  alt={s.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-xl">{s.title}</h3>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.short}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
