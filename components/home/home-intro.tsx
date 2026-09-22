import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"

const stats = [
  { value: "Since 2004", label: "Experience in the trade" },
  { value: "75 mi", label: "Service radius from Peoria" },
  { value: "Family", label: "Owned & operated" },
]

export function HomeIntro() {
  return (
    <section className="bg-background">
      <div className="container mx-auto grid items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src="/images/about-craft.png"
            alt="Craftsman hand-finishing a hardwood floor"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <SectionHeading
            eyebrow="Who we are"
            title="A trusted, family-owned hardwood specialist"
            description="We treat every floor like it's in our own home — careful prep, honest recommendations, and a finish that holds up to real life. From a single room refresh to a full commercial install, we bring the same attention to detail."
          />
          <p className="mt-4 text-muted-foreground leading-relaxed">
            No pushy sales, no fine-print surprises. Just clear guidance and quality workmanship you can stand on for
            years.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="font-serif text-2xl text-foreground md:text-3xl">{s.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 font-medium text-foreground underline-offset-4 hover:underline"
          >
            More about us
            <ArrowUpRight className="h-4 w-4 text-accent" />
          </Link>
        </div>
      </div>
    </section>
  )
}
