import { Phone, Mail } from "lucide-react"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

export function CtaBand({
  title = "Ready to talk about your floors?",
  subtitle = "Call or email to discuss your project and the right next step. We answer real questions — no fragile contact forms.",
  className,
}: {
  title?: string
  subtitle?: string
  className?: string
}) {
  return (
    <section className={cn("bg-foreground text-background", className)}>
      <div className="container mx-auto grid items-center gap-8 px-6 py-16 md:grid-cols-[1.4fr_1fr] md:py-20">
        <div>
          <h2 className="font-serif text-3xl leading-tight text-balance md:text-4xl">{title}</h2>
          <p className="mt-4 max-w-xl text-background/70">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-3">
          <a
            href={site.phoneHref}
            className="flex items-center justify-between gap-4 bg-background px-6 py-4 text-foreground transition-transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-accent" />
              <span className="font-medium">{site.phone}</span>
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Call now</span>
          </a>
          <a
            href={site.emailHref}
            className="flex items-center justify-between gap-4 border border-background/30 px-6 py-4 transition-colors hover:bg-background/10"
          >
            <span className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-accent" />
              <span className="break-all font-medium">Email us</span>
            </span>
            <span className="hidden text-xs uppercase tracking-widest text-background/50 sm:block">Reply-friendly</span>
          </a>
        </div>
      </div>
    </section>
  )
}
