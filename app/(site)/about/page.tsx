import { metadataForPath } from "@/lib/seo/resolver"
import Image from "next/image"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { Awards } from "@/components/awards"
import { ServiceAreaBand } from "@/components/service-area-band"
import { CtaBand } from "@/components/cta-band"
import { HeartHandshake, ShieldCheck, Ruler, Leaf } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/about")

const values = [
  {
    icon: HeartHandshake,
    title: "Family owned",
    body: "You work directly with the people doing the work — not a call center. We stand behind every floor we touch.",
  },
  {
    icon: Ruler,
    title: "Craftsmanship first",
    body: "Careful prep, precise sanding, and clean detail work around cabinets, stairs, and transitions.",
  },
  {
    icon: ShieldCheck,
    title: "Honest guidance",
    body: "We recommend what your floor actually needs — including sandless when a full refinish isn't necessary.",
  },
  {
    icon: Leaf,
    title: "Quality materials",
    body: "Trusted finishes and stains from Bona, Rubio Monocoat, and DuraSeal for lasting results.",
  },
]

export default function AboutPage() {
  return (
    <>
      <StructuredData
        graph={buildPageEntityGraph("/about", [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
        ])}
      />
      <PageHero
        eyebrow="Our story"
        title="Rooted in Peoria, built on trust."
        description="A family-owned hardwood flooring company that treats your home and business like our own."
        image="/images/about-craft.png"
        imageAlt="Craftsman refinishing a hardwood floor"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
        ]}
      />

      <section className="bg-background">
        <div className="container mx-auto grid items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <SectionHeading
              eyebrow="Who we are"
              title="Hardwood is all we do — and we do it right"
            />
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Peoria Hardwood Floors is a family-owned business serving homeowners and businesses throughout Peoria
                and the surrounding Central Illinois region. We specialize entirely in wood — installation, sanding,
                refinishing, staining, and durable finishing — so every project gets focused, experienced hands.
              </p>
              <p>
                We believe a floor should be beautiful and honest. That means clear communication, realistic
                timelines, and recommendations based on what your floor truly needs. If a lower-cost sandless refresh
                will do the job, we&apos;ll tell you — we&apos;re not here to oversell.
              </p>
              <p>
                From a single worn room to a full commercial gymnasium, we bring the same standard of care and finish
                every time.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src="/images/new-images/IMG_0216.jpg"
              alt="Freshly refinished hardwood floor in a bright living room"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <Awards />

      <section className="bg-secondary">
        <div className="container mx-auto px-6 py-20 lg:py-28">
          <SectionHeading eyebrow="What we stand for" title="Values you can stand on" align="center" />
          <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="bg-background p-8">
                <v.icon className="h-8 w-8 text-accent" />
                <h3 className="mt-5 font-serif text-xl">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceAreaBand />
      <CtaBand />
    </>
  )
}
