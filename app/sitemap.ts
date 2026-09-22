import type { MetadataRoute } from "next"
import { services } from "@/lib/site"
import { canonicalUrl, PUBLIC_STATIC_ROUTES } from "@/lib/seo/resolver"
import { locationRecords, locationSitemapEntries } from "@/lib/seo/local"

const interactiveRoutes = new Set(["/estimate-calculator", "/visualizer"])

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = PUBLIC_STATIC_ROUTES
    .filter((path) => !interactiveRoutes.has(path))
    .map((path) => ({ url: canonicalUrl(path), changeFrequency: "monthly" as const, priority: path === "/" ? 1 : 0.7 }))

  const serviceEntries = services.map((service) => ({
    url: canonicalUrl(`/services/${service.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...staticEntries, ...serviceEntries, ...locationSitemapEntries(locationRecords)]
}
