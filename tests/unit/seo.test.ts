import { describe, expect, it } from "vitest"
import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { canonicalUrl, createPageMetadata, PUBLIC_STATIC_ROUTES } from "@/lib/seo/resolver"
import { services } from "@/lib/site"

describe("technical SEO foundation", () => {
  it("creates deterministic production HTTPS canonicals without queries", () => {
    expect(canonicalUrl("/services?utm_source=test")).toBe("https://peoriahardwoodfloors.com/services")
    expect(canonicalUrl("/")).toBe("https://peoriahardwoodfloors.com")
    expect(() => canonicalUrl("https://example.com/private")).toThrow()
  })

  it("creates indexable metadata with canonical, Open Graph, and Twitter fields", () => {
    const metadata = createPageMetadata({ title: "Test page", description: "Useful description", path: "/about" })
    expect(metadata.alternates?.canonical).toBe("https://peoriahardwoodfloors.com/about")
    expect(metadata.robots).toEqual({ index: true, follow: true })
    expect(metadata.openGraph?.url).toBe("https://peoriahardwoodfloors.com/about")
    expect(metadata.twitter).toMatchObject({ card: "summary" })
  })

  it("marks utility metadata noindex without removing metadata", () => {
    const metadata = createPageMetadata({ title: "Utility", description: "Description", path: "/visualizer", indexable: false })
    expect(metadata.robots).toEqual({ index: false, follow: true })
    expect(metadata.title).toBe("Utility")
  })

  it("keeps robots public while disallowing private application areas", () => {
    const result = robots()
    expect(result.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] })
    expect(result.sitemap).toBe("https://peoriahardwoodfloors.com/sitemap.xml")
  })

  it("contains only approved public routes and current service URLs", () => {
    const urls = sitemap().map((entry) => entry.url)
    expect(urls).toHaveLength(PUBLIC_STATIC_ROUTES.length + services.length)
    expect(urls).toContain("https://peoriahardwoodfloors.com")
    expect(urls).toContain("https://peoriahardwoodfloors.com/services/hardwood-floor-installation-peoria-il")
    expect(urls.some((url) => url.includes("/admin") || url.includes("/api") || url.includes("login"))).toBe(false)
    expect(urls).not.toContain("https://peoriahardwoodfloors.com/visualizer")
    expect(urls).not.toContain("https://peoriahardwoodfloors.com/estimate-calculator")
  })
})
