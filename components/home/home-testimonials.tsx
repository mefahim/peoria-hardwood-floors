import { Quote } from "lucide-react"
import { testimonials } from "@/lib/site"
import { SectionHeading } from "@/components/section-heading"

export function HomeTestimonials() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-20 lg:py-28">
        <SectionHeading eyebrow="Kind words" title="What Central Illinois says" align="center" />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col border border-border p-8">
              <Quote className="h-8 w-8 text-accent" />
              <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-foreground/90">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                — {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
