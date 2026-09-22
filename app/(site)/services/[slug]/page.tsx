import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowRight, Check, Phone } from "lucide-react"
import { services, site } from "@/lib/site"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { CtaBand } from "@/components/cta-band"
import { createPageMetadata } from "@/lib/seo/resolver"
import { StructuredData } from "@/components/seo/structured-data"
import { buildEntityGraph } from "@/lib/seo/structured-data"

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = services.find((s) => s.slug === slug)
  if (!service) return {}
  return createPageMetadata({
    title: `${service.title} in Peoria & Central Illinois`,
    description: `${service.short} Call ${site.phone} for a free assessment.`,
    path: `/services/${service.slug}`,
  })
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = services.find((s) => s.slug === slug)
  if (!service) notFound()

  const others = services.filter((s) => s.slug !== slug).slice(0, 3)

  return (
    <>
      <StructuredData
        graph={buildEntityGraph({
          path: `/services/${service.slug}`,
          title: `${service.title} in Peoria & Central Illinois`,
          description: service.short,
          service,
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            { label: service.title, href: `/services/${service.slug}` },
          ],
        })}
      />
      <PageHero
        eyebrow="Service"
        title={service.hero}
        description={service.short}
        image={service.image}
        imageAlt={service.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.title, href: `/services/${service.slug}` },
        ]}
      />

      <section className="bg-background">
        <div className="container mx-auto grid gap-12 px-6 py-20 lg:grid-cols-[1.5fr_1fr] lg:py-28">
          <div className="space-y-12">
            <div>
              <SectionHeading eyebrow="Who it's for" title={service.title} />
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{service.who}</p>
            </div>

            <div>
              <h3 className="font-serif text-2xl">How the process works</h3>
              <ol className="mt-6 space-y-4">
                {service.process.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border font-serif text-sm">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="font-serif text-2xl">What affects your price</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Every project is unique — these are the main factors we weigh when quoting.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {service.factors.map((f) => (
                  <li key={f} className="flex items-start gap-3 border border-border p-4 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-2xl">Frequently asked</h3>
              <div className="mt-6 divide-y divide-border border-y border-border">
                {service.faqs.map((faq) => (
                  <details key={faq.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {faq.q}
                      <span className="text-accent transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="border border-border bg-secondary p-8">
              <h3 className="font-serif text-2xl">Get a free assessment</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Tell us about your space and we&apos;ll give honest guidance and a realistic estimate — no pressure.
              </p>
              <a
                href={site.phoneHref}
                className="mt-6 flex items-center justify-center gap-2 bg-foreground px-6 py-4 font-medium text-background transition-transform hover:-translate-y-0.5"
              >
                <Phone className="h-4 w-4" />
                {site.phone}
              </a>
              <Link
                href="/estimate-calculator"
                className="mt-3 flex items-center justify-center gap-2 border border-border bg-background px-6 py-4 font-medium transition-colors hover:bg-background/60"
              >
                Try the estimate calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-secondary">
        <div className="container mx-auto px-6 py-20">
          <h2 className="font-serif text-2xl md:text-3xl">Explore other services</h2>
          <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
            {others.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="group bg-background p-6 transition-colors hover:bg-secondary">
                <div className="relative mb-4 aspect-[3/2] overflow-hidden">
                  <Image
                    src={s.image || "/placeholder.svg"}
                    alt={s.title}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-serif text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
