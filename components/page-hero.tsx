import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  breadcrumbs,
}: {
  eyebrow?: string
  title: string
  description?: string
  image: string
  imageAlt: string
  breadcrumbs?: { label: string; href: string }[]
}) {
  return (
    <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-foreground pt-24">
      <Image
        src={image || "/placeholder.svg"}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-foreground/20" />
      <div className="container relative mx-auto px-6 pb-14 text-background">
        {breadcrumbs ? (
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-background/60">
            {breadcrumbs.map((b, i) => (
              <span key={b.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <Link href={b.href} className="transition-colors hover:text-background">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? (
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="max-w-3xl font-serif text-4xl leading-[1.05] text-balance md:text-5xl lg:text-6xl">{title}</h1>
        {description ? (
          <p className="mt-5 max-w-xl text-background/75 leading-relaxed text-pretty">{description}</p>
        ) : null}
      </div>
    </section>
  )
}
