import { describe, expect, it } from "vitest"
import { services, site } from "@/lib/site"
import { canonicalUrl } from "@/lib/seo/resolver"
import {
  buildEntityGraph,
  buildOrganization,
  buildPageEntityGraph,
  buildService,
  buildServicePageEntityGraph,
  buildWebPage,
  buildWebSite,
  ORGANIZATION_ID,
  serializeJsonLd,
  WEBSITE_ID,
} from "@/lib/seo/structured-data"

function nodesFor(graph: ReturnType<typeof buildPageEntityGraph>) {
  return graph["@graph"]
}

describe("structured data and entity SEO", () => {
  it("builds one canonical Organization with only verified facts", () => {
    const organization = buildOrganization()
    expect(organization["@id"]).toBe(ORGANIZATION_ID)
    expect(organization.name).toBe(site.name)
    expect(organization.telephone).toBe("+13098635246")
    expect(organization.email).toBe(site.email)
    expect(organization).not.toHaveProperty("address")
    expect(organization).not.toHaveProperty("openingHoursSpecification")
    expect(organization).not.toHaveProperty("sameAs")
    expect(organization).not.toHaveProperty("aggregateRating")
    expect(organization).not.toHaveProperty("review")
    expect(organization).not.toHaveProperty("award")
    expect(organization).not.toHaveProperty("memberOf")
  })

  it("builds a WebSite that references the canonical Organization", () => {
    const website = buildWebSite()
    expect(website["@id"]).toBe(WEBSITE_ID)
    expect(website.publisher).toEqual({ "@id": ORGANIZATION_ID })
    expect(website.url).toBe("https://peoriahardwoodfloors.com")
  })

  it("builds WebPage relationships with canonical, query-free URLs", () => {
    const page = buildWebPage("/about?utm_source=test", "About", "Description")
    expect(page["@id"]).toBe("https://peoriahardwoodfloors.com/about#webpage")
    expect(page.url).toBe(canonicalUrl("/about"))
    expect(page.isPartOf).toEqual({ "@id": WEBSITE_ID })
    expect(page.about).toEqual({ "@id": ORGANIZATION_ID })
  })

  it("represents all six centralized services and links each provider", () => {
    expect(services).toHaveLength(6)
    for (const service of services) {
      const node = buildService(service)
      expect(node["@type"]).toBe("Service")
      expect(node.name).toBe(service.title)
      expect(node.description).toBe(service.short)
      expect(node.url).toBe(canonicalUrl(`/services/${service.slug}`))
      expect(node.provider).toEqual({ "@id": ORGANIZATION_ID })
      expect(node.mainEntityOfPage).toEqual({ "@id": `${node.url}#webpage` })
    }
  })

  it("does not fabricate a Service entity for an unknown slug", () => {
    expect(buildServicePageEntityGraph("unknown-service", [])).toBeNull()
  })

  it("creates sequential absolute breadcrumb items", () => {
    const graph = buildPageEntityGraph("/about", [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
    ])
    const breadcrumb = nodesFor(graph).find((node) => node["@type"] === "BreadcrumbList")
    expect(breadcrumb?.["@type"]).toBe("BreadcrumbList")
    if (breadcrumb?.["@type"] === "BreadcrumbList") {
      expect(breadcrumb.itemListElement.map((item) => item.position)).toEqual([1, 2])
      expect(breadcrumb.itemListElement.every((item) => item.item.startsWith("https://peoriahardwoodfloors.com"))).toBe(true)
    }
  })

  it("omits optional unverified properties instead of emitting null or empty values", () => {
    const organization = buildOrganization()
    const serialized = JSON.stringify(organization)
    expect(serialized).not.toContain("address")
    expect(serialized).not.toContain("sameAs")
    expect(serialized).not.toContain("null")
  })

  it("escapes script-breaking characters during JSON-LD serialization", () => {
    const graph = buildEntityGraph({
      path: "/about",
      title: "Safe </script><script>alert(1)</script>",
      description: "Safe <content> & text",
    })
    const serialized = serializeJsonLd(graph)
    expect(serialized).not.toContain("</script>")
    expect(serialized).toContain("\\u003c/script\\u003e")
    expect(serialized).toContain("\\u0026")
  })

  it("does not expose arbitrary schema types through the typed graph", () => {
    const graph = buildPageEntityGraph("/services", [])
    expect(nodesFor(graph).every((node) => ["Organization", "WebSite", "WebPage", "BreadcrumbList", "Service"].includes(node["@type"]))).toBe(true)
  })

  it("keeps noindex utility policy outside the structured-data page builder", () => {
    const graph = buildPageEntityGraph("/", [])
    expect(nodesFor(graph).some((node) => node["@type"] === "Service")).toBe(false)
  })
})
