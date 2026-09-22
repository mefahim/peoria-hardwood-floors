import { Award } from "lucide-react"
import { clients } from "@/lib/site"

export function Awards() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-6 py-14">
        <div className="flex flex-col items-center gap-10 md:flex-row md:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-3 border border-border px-5 py-4">
              <span className="font-serif text-3xl leading-none">40</span>
              <span className="text-xs uppercase leading-tight tracking-[0.18em] text-muted-foreground">
                Under
                <br />
                40 Honoree
              </span>
            </div>
            <div className="flex items-center gap-3 border border-border px-5 py-4">
              <Award className="h-8 w-8 text-accent" />
              <span className="text-xs uppercase leading-tight tracking-[0.18em] text-muted-foreground">
                Award-winning
                <br />
                service · Central Illinois
              </span>
            </div>
          </div>
          <p className="max-w-sm text-center text-sm text-muted-foreground md:text-right">
            Recognized craftsmanship and a reputation built one Central Illinois floor at a time.
          </p>
        </div>
      </div>
    </section>
  )
}

export function ClientsStrip() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-14">
        <p className="mb-8 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          We work with trusted flooring products
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {clients.map((c) => (
            <li key={c} className="font-serif text-xl text-foreground/40 transition-colors hover:text-foreground/70">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
