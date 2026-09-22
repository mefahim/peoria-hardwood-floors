import { clients } from "@/lib/site"

export function Awards() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Focused on wood</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Installation, sanding, refinishing, stains, and finishes for homes and businesses across Peoria and Central Illinois.
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
