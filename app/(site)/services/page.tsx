import { metadataForPath } from "@/lib/seo/resolver"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { services } from "@/lib/site"
import { PageHero } from "@/components/page-hero"
import { ServiceAreaBand } from "@/components/service-area-band"
import { CtaBand } from "@/components/cta-band"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/services")

export default function ServicesPage() {
  return (
    <>
      <StructuredData
        graph={buildPageEntityGraph("/services", [
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
        ])}
      />
      <PageHero
        eyebrow="Services"
        title="Everything we do with wood."
        description="Focused expertise for residential and commercial projects across Peoria and Central Illinois."
        image="/images/new-images/IMG_1224.jpeg"
        imageAlt="Hardwood floor installation in progress"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
        ]}
      />

      <section className="bg-background">
        <div className="container mx-auto space-y-px px-6 py-20 lg:py-28">
          {services.map((s, i) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group grid items-center gap-8 border-t border-border py-10 first:border-t-0 lg:grid-cols-[1fr_1.3fr] lg:gap-12"
            >
              <div className={`relative aspect-[4/3] overflow-hidden ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <Image
                  src={s.image || "/placeholder.svg"}
                  alt={s.title}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-accent">0{i + 1}</p>
                <h2 className="mt-3 flex items-center gap-3 font-serif text-2xl md:text-3xl lg:text-4xl">
                  {s.title}
                  <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                </h2>
                <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">{s.short}</p>
                <p className="mt-6 text-sm font-medium uppercase tracking-wide text-foreground underline-offset-4 group-hover:underline">
                  View service
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ServiceAreaBand />
      <CtaBand />
    </>
  )
}
