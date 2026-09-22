import Link from "next/link"
import { Phone, Mail, Facebook, Instagram, MapPin } from "lucide-react"
import { site, serviceAreas, services } from "@/lib/site"
import { Logo } from "@/components/logo"

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Logo className="h-16 w-[300px] text-background sm:h-20 sm:w-[350px]" />
            <p className="max-w-xs text-sm leading-relaxed text-background/70">{site.tagline}</p>
            <div className="flex gap-3">
              <a
                href={site.facebook}
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center border border-background/25 transition-colors hover:bg-background hover:text-foreground"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={site.instagram}
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center border border-background/25 transition-colors hover:bg-background hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-background/50">Services</h3>
            <ul className="space-y-2.5 text-sm">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="text-background/75 transition-colors hover:text-background">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-background/50">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "About", href: "/about" },
                { label: "Finishes", href: "/finishes" },
                { label: "Stains", href: "/stains" },
                { label: "Products", href: "/products" },
                { label: "Gallery", href: "/gallery" },
                { label: "Estimate Calculator", href: "/estimate-calculator" },
                { label: "Flooring Visualizer", href: "/visualizer" },
                { label: "Contact", href: "/contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-background/75 transition-colors hover:text-background">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-background/50">Get in touch</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={site.phoneHref} className="flex items-center gap-3 text-background/85 hover:text-background">
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={site.emailHref} className="flex items-center gap-3 break-all text-background/85 hover:text-background">
                  <Mail className="h-4 w-4 shrink-0 text-accent" />
                  {site.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-background/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>Serving Peoria & surrounding Central Illinois communities, {site.serviceRadius}.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-background/15 pt-8">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-background/50">Service Area</p>
          <p className="text-sm leading-relaxed text-background/65">{serviceAreas.join(" · ")}</p>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-background/15 pt-6 text-xs text-background/50 sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. Family owned & operated.
          </p>
          <p>Estimates are rough guides — final pricing depends on site conditions and project scope.</p>
        </div>
      </div>
    </footer>
  )
}
