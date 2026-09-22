"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, X } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { CtaBand } from "@/components/cta-band"
import { site } from "@/lib/site"

const products = [
  {
    title: "Unfinished Hardwood",
    body: "Start with raw boards and make every decision yours. Unfinished flooring gives us the flexibility to customize species, width, grade, stain, texture, and finish on site.",
    image: "/images/new-images/IMG_0039.JPG",
    details: ["Custom stain matching", "Site-finished surface", "Many species and widths"],
  },
  {
    title: "Prefinished Hardwood",
    body: "Get the character of real wood with a factory-cured finish and a faster installation process. We can help compare wear layers, edges, sheen, and board profiles.",
    image: "/images/new-images/IMG_0070.JPG",
    details: ["Consistent factory finish", "Fast return to service", "Solid and engineered options"],
  },
  {
    title: "Engineered Hardwood",
    body: "A real wood wear layer over a stable multi-ply core makes engineered flooring a smart choice for basements, additions, and homes with changing seasonal conditions.",
    image: "/images/new-images/IMG_0176.JPG",
    details: ["Real wood top layer", "Stable construction", "Flexible installation methods"],
  },
  {
    title: "Exotic Wood Species",
    body: "Bring a distinctive grain, color, or origin into the room with exotic species selected for the character and performance your project calls for.",
    image: "/images/new-images/IMG_0210.jpg",
    details: ["Distinctive grain patterns", "Unique natural color", "Sourced to specification"],
  },
  {
    title: "End Grain Flooring",
    body: "End grain blocks create a graphic, durable surface with a tactile pattern unlike standard plank flooring. It is a statement material for thoughtful spaces.",
    image: "/images/new-images/IMG_0266.JPG",
    details: ["Architectural visual interest", "Exceptional durability", "Custom layout planning"],
  },
  {
    title: "Chevron & Herringbone",
    body: "Directional patterns turn the floor into architecture. We can help with proportions, borders, transitions, and the installation details these layouts demand.",
    image: "/images/new-images/IMG_0379.jpeg",
    details: ["Chevron and herringbone layouts", "Borders and inlays", "Precision installation"],
  },
  {
    title: "Reclaimed Flooring",
    body: "Give a room history with reclaimed wood sourced for its patina, saw marks, nail character, and one-of-a-kind presence. We will talk through grading and expectations up front.",
    image: "/images/new-images/IMG_0484.jpeg",
    details: ["Natural patina and character", "Historic and recycled material", "Careful sourcing and prep"],
  },
]

const catalogProducts = [
  { title: "Unfinished Domestic", source: "Domestic solid hardwood in multiple species, grades, cuts, widths, and custom specifications.", items: ["Yellow pine grade 2", "Yellow pine grade 1", "Yellow birch character", "Red oak character", "2 common white oak", "1 common white oak"], image: "/images/rhodes-product-catalog.png" },
  { title: "Prefinished Exotic", source: "Imported Brazilian and exotic flooring with factory aluminum-oxide finish options.", items: ["Brazilian walnut", "Brazilian cherry", "Santos mahogany", "Brazilian teak", "Tigerwood", "Patagonian rosewood"], image: "/images/new-images/IMG_0210.jpg" },
  { title: "Unfinished Exotic", source: "Distinctive imported species available for custom site finishing and special-order projects.", items: ["Golden teak garapa", "Caribbean heart pine", "Brazilian walnut", "Brazilian teak cumaru", "Brazilian chestnut sucupira", "Brazilian cherry herringbone", "Brazilian oak tauari"], image: "/images/new-images/IMG_0266.JPG" },
  { title: "Engineered Hardwood", source: "Stable multi-ply construction for concrete, basements, radiant heat, condos, and extra-wide planks.", items: ["White oak character", "Walnut character", "Select white oak", "Select walnut", "Herringbone white oak", "Chevron walnut", "Circle sawn oak", "Heart pine"], image: "/images/new-images/IMG_0379.jpeg" },
  { title: "Engineered Exotic", source: "Imported exotic engineered flooring with flexible widths and a substantial real-wood wear layer.", items: ["Santos mahogany", "Patagonian rosewood", "Brazilian walnut", "Brazilian pecan", "Brazilian cherry", "Bolivian rosewood", "Amendoim"], image: "/images/new-images/IMG_0484.jpeg" },
  { title: "Reclaimed Flooring", source: "Historic wood salvaged from barns, grain elevators, factories, fencing, and other structures.", items: ["Black n tan oak", "Reclaimed gym floor", "Reclaimed heart pine", "Reclaimed resawn oak", "Reclaimed yellow pine", "White pine", "Circle sawn oak", "Circle sawn pine"], image: "/images/new-images/IMG_1678.jpeg" },
  { title: "Mosaic & End Grain", source: "Small wood blocks, end grain, edge grain, hexagons, and custom patterns for floors or feature installations.", items: ["White oak end grain", "White oak edge grain", "Ponderosa pine end grain", "Douglas fir end grain", "American grain end grain"], image: "/images/new-images/IMG_2083.JPG" },
]

export default function ProductsPage() {
  const [selectedCatalog, setSelectedCatalog] = useState<(typeof catalogProducts)[number] | null>(null)

  return (
    <>
      <PageHero
        eyebrow="Flooring products"
        title="A floor that feels like it belongs there."
        description="Peoria Hardwood Floors offers a wide variety of wood flooring options, from classic unfinished oak to custom patterns, reclaimed boards, and specialty materials sourced for your project."
        image="/images/new-images/IMG_1778.JPG"
        imageAlt="Real hardwood flooring installation"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }]}
      />

      <main>
        <section className="container mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">One page, every direction</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-balance md:text-5xl">
              More than a catalog. A place to start the conversation.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              We work with a range of manufacturers, mills, importers, and reclaimed flooring specialists. Options can be reviewed against your project specifications, including species, width, stain, finish, and texture where available.
            </p>
          </div>

          <div className="mt-16 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <article key={product.title} className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <Image
                    src={product.image}
                    alt={`${product.title} flooring example`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 bg-background/90 px-3 py-1 text-xs uppercase tracking-[0.16em] text-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="pt-6">
                  <h3 className="font-serif text-2xl">{product.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{product.body}</p>
                  <ul className="mt-5 space-y-2 text-sm text-foreground/80">
                    {product.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setSelectedCatalog(catalogProducts[index])}
                    className="mt-6 inline-flex items-center gap-2 border border-foreground/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                  >
                    View all products <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-secondary">
          <div className="container mx-auto grid gap-10 px-6 py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:py-24">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.24em] text-accent">Need help narrowing it down?</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">Tell us what you are imagining.</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                Feel free to reach out. We would be happy to help with your flooring needs, talk through samples, and source a product that fits your space, budget, and daily life.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/services/hardwood-floor-installation-peoria-il" className="inline-flex items-center gap-2 border border-foreground px-6 py-3 font-medium hover:bg-background">
                Plan an installation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 bg-foreground px-6 py-3 font-medium text-background hover:bg-accent">
                Talk with us <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={site.phoneHref} className="inline-flex items-center border border-foreground px-6 py-3 font-medium hover:bg-background">
                Call {site.phone}
              </a>
            </div>
          </div>
        </section>
      </main>

      {selectedCatalog ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-sm" role="presentation" onClick={() => setSelectedCatalog(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-dialog-title"
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close product catalog"
              onClick={() => setSelectedCatalog(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid md:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-64 bg-muted md:min-h-full">
                <Image src={selectedCatalog.image} alt={`${selectedCatalog.title} flooring`} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
              </div>
              <div className="p-8 md:p-10">
                <p className="text-xs uppercase tracking-[0.22em] text-accent">Product catalog</p>
                <h2 id="catalog-dialog-title" className="mt-3 font-serif text-3xl md:text-4xl">{selectedCatalog.title}</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">{selectedCatalog.source}</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {selectedCatalog.items.map((item) => (
                    <div key={item} className="border-b border-border pb-3 text-sm text-foreground/85">{item}</div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/contact" onClick={() => setSelectedCatalog(null)} className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-accent">Ask about this category <ArrowRight className="h-4 w-4" /></Link>
                  <a href={site.phoneHref} className="inline-flex items-center border border-foreground/20 px-5 py-3 text-sm font-medium hover:border-foreground">Call {site.phone}</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <CtaBand />
    </>
  )
}
