import { Quote } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"

export function HomeTestimonials() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-20 lg:py-28">
        <SectionHeading eyebrow="A thoughtful process" title="Clear guidance for your flooring project" align="center" />
        <div className="mx-auto mt-14 grid max-w-3xl gap-8 md:grid-cols-3">
          {["Assess the space and existing floor", "Compare materials, stains, and finishes", "Plan the right next step for the project"].map((step, index) => (
            <div key={step} className="border border-border p-8 text-center">
              <Quote className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-5 font-serif text-xl">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
