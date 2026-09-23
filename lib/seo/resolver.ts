import type { Metadata } from "next"
import { readSeoOverrideSync } from "@/lib/seo/override-store"

type Robots = {
  index?: boolean
  follow?: boolean
  googleBot?: { index?: boolean; follow?: boolean }
}

export const PRODUCTION_ORIGIN = "https://peoriahardwoodfloors.com"
const SOCIAL_IMAGE = {
  url: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Bright kitchen with light hardwood flooring",
} as const

export const PUBLIC_STATIC_ROUTES = [
  "/",
  "/about",
  "/services",
  "/finishes",
  "/stains",
  "/products",
  "/gallery",
  "/pricing",
  "/contact",
] as const

export const INTERACTIVE_ROUTE_POLICY = {
  "/estimate-calculator": { indexable: false, reason: "Utility calculator without approved search landing-page intent." },
  "/visualizer": { indexable: false, reason: "Interactive tool; indexability awaits substantial server-rendered explanatory content." },
} as const

export const SEO_ROUTE_METADATA = {
  "/": {
    title: "Hardwood Flooring Installation & Refinishing in Peoria",
    description: "Peoria Hardwood Floors provides hardwood installation, sanding, refinishing, stains, and custom finishes for homes and businesses across Central Illinois.",
  },
  "/about": {
    title: "About — Family-Owned Hardwood Flooring in Peoria",
    description: "Meet Peoria Hardwood Floors, a family-owned flooring company focused on careful preparation, honest guidance, installation, and refinishing across Central Illinois.",
  },
  "/services": {
    title: "Hardwood Flooring Services in Peoria & Central Illinois",
    description: "Explore hardwood floor installation, sanding and refinishing, sandless refreshes, commercial floors, deck refinishing, and cabinet refinishing.",
  },
  "/finishes": {
    title: "Hardwood Floor Finishes in Peoria",
    description: "Compare waterborne, oil-based, matte, and hardwax oil finish directions for hardwood floors, with guidance for choosing the right look and feel.",
  },
  "/stains": {
    title: "Hardwood Floor Stains and Colors in Peoria",
    description: "Explore hardwood stain directions from natural and warm neutrals to gray and deeper tones, then choose samples for your actual floor.",
  },
  "/products": {
    title: "Hardwood Flooring Products and Materials",
    description: "See the hardwood, engineered, laminate, LVP, stains, and finish systems used in flooring projects by Peoria Hardwood Floors.",
  },
  "/gallery": {
    title: "Hardwood Flooring Project Gallery in Central Illinois",
    description: "Browse examples of hardwood installation, refinishing, stains, custom details, decks, cabinets, and commercial flooring work.",
  },
  "/pricing": {
    title: "Hardwood Flooring Pricing in Peoria",
    description: "Learn what affects the cost of installation, sanding, refinishing, stains, finishes, repairs, and other hardwood flooring projects.",
  },
  "/contact": {
    title: "Contact Peoria Hardwood Floors",
    description: "Talk with Peoria Hardwood Floors about installation, refinishing, stains, finishes, decks, cabinets, or commercial flooring in Central Illinois.",
  },
  "/estimate-calculator": {
    title: "Hardwood Flooring Estimate Calculator",
    description: "Use this simple planning calculator to explore a rough flooring project range before discussing your space, materials, prep, and scope.",
  },
  "/visualizer": {
    title: "Hardwood Floor Visualizer",
    description: "Preview flooring directions for your room and use the result as a starting point for a conversation about wood, stain, finish, and layout.",
  },
} as const

type MetadataOptions = {
  title: string
  description: string
  path: string
  indexable?: boolean
  canonical?: string
}

export function canonicalUrl(path: string, override?: string): string {
  const candidate = override ?? path
  const url = new URL(candidate, PRODUCTION_ORIGIN)
  if (url.protocol !== "https:" || url.hostname !== "peoriahardwoodfloors.com") {
    throw new Error("SEO canonical must use the production HTTPS hostname.")
  }
  url.search = ""
  url.hash = ""
  return url.toString().replace(/\/$/, "") || PRODUCTION_ORIGIN
}

export function createPageMetadata({ title, description, path, indexable = true, canonical }: MetadataOptions): Metadata {
  const url = canonicalUrl(path, canonical)
  const override = readSeoOverrideSync(path)
  const effectiveTitle = override?.title ?? title
  const effectiveDescription = override?.description ?? description
  const robots: Robots = indexable ? { index: true, follow: true } : { index: false, follow: true }
  return {
    title: effectiveTitle,
    description: effectiveDescription,
    alternates: { canonical: url },
    robots,
    openGraph: {
      title: effectiveTitle,
      description: effectiveDescription,
      type: "website",
      url,
      locale: "en_US",
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary",
      title: effectiveTitle,
      description: effectiveDescription,
      images: [SOCIAL_IMAGE.url],
    },
  }
}

export function metadataForPath(path: keyof typeof SEO_ROUTE_METADATA): Metadata {
  const config = SEO_ROUTE_METADATA[path]
  const policy = INTERACTIVE_ROUTE_POLICY[path as keyof typeof INTERACTIVE_ROUTE_POLICY]
  return createPageMetadata({ ...config, path, indexable: policy?.indexable ?? true })
}

export function isApprovedPublicPath(path: string): boolean {
  return (PUBLIC_STATIC_ROUTES as readonly string[]).includes(path) || path.startsWith("/services/")
}
