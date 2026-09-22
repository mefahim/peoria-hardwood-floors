import { MapPin } from "lucide-react"
import { serviceAreas, site } from "@/lib/site"
import { SectionHeading } from "@/components/section-heading"

export function ServiceAreaBand() {
  return (
    <section className="border-y border-border bg-secondary">
      <div className="container mx-auto px-6 py-16 md:py-20">
        <SectionHeading
          eyebrow="Where we work"
          title="Serving Peoria & Central Illinois"
          description={`We travel to homes and businesses ${site.serviceRadius}. If you're nearby and not listed, give us a call — chances are we cover your town.`}
        />
        <ul className="mt-10 flex flex-wrap gap-3">
          {serviceAreas.map((area) => (
            <li
              key={area}
              className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-sm text-foreground/80"
            >
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {area}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
