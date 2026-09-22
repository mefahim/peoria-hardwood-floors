import type { Service } from "@/lib/site"
import { services, site } from "@/lib/site"
import { canPublishLocalBusiness, type BusinessEntitySettings } from "@/lib/seo/local"
import { canonicalUrl, PRODUCTION_ORIGIN, SEO_ROUTE_METADATA } from "@/lib/seo/resolver"
import type {
  BreadcrumbListNode,
  EntityGraph,
  EntityNode,
  LocalBusinessNode,
  OrganizationNode,
  SchemaReference,
  ServiceNode,
  WebPageNode,
  WebSiteNode,
} from "@/lib/seo/types"

export const ORGANIZATION_ID = `${PRODUCTION_ORIGIN}/#organization`
export const WEBSITE_ID = `${PRODUCTION_ORIGIN}/#website`
export const LOCAL_BUSINESS_ID = `${PRODUCTION_ORIGIN}/#localbusiness`

export type BreadcrumbInput = { label: string; href: string }

type PageInput = {
  path: string
  title: string
  description: string
  breadcrumbs?: BreadcrumbInput[]
  service?: Service
  localBusiness?: BusinessEntitySettings
}

function stableId(path: string, suffix: "webpage" | "breadcrumb" | "service"): string {
  return `${canonicalUrl(path)}#${suffix}`
}

function reference(id: string): SchemaReference {
  return { "@id": id }
}

export function buildOrganization(): OrganizationNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: PRODUCTION_ORIGIN,
    telephone: site.phoneHref.replace(/^tel:/, ""),
    email: site.email,
    description: site.tagline,
  }
}

export function buildWebSite(): WebSiteNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: PRODUCTION_ORIGIN,
    name: site.name,
    publisher: reference(ORGANIZATION_ID),
  }
}

export function buildWebPage(path: string, title: string, description: string): WebPageNode {
  const url = canonicalUrl(path)
  return {
    "@type": "WebPage",
    "@id": stableId(path, "webpage"),
    url,
    name: title,
    description,
    isPartOf: reference(WEBSITE_ID),
    about: reference(ORGANIZATION_ID),
  }
}

export function buildService(service: Service): ServiceNode {
  const path = `/services/${service.slug}`
  const url = canonicalUrl(path)
  return {
    "@type": "Service",
    "@id": stableId(path, "service"),
    name: service.title,
    description: service.short,
    url,
    provider: reference(ORGANIZATION_ID),
    mainEntityOfPage: reference(stableId(path, "webpage")),
  }
}

export function buildLocalBusiness(entity: BusinessEntitySettings): LocalBusinessNode | null {
  if (!canPublishLocalBusiness(entity) || !entity.address || !entity.businessType) return null
  const localBusiness: LocalBusinessNode = {
    "@type": entity.businessType,
    "@id": LOCAL_BUSINESS_ID,
    name: entity.name,
    url: entity.url,
    telephone: entity.phone,
    email: entity.email,
    address: {
      "@type": "PostalAddress",
      ...entity.address,
    },
  }
  if (entity.geo) localBusiness.geo = { "@type": "GeoCoordinates", ...entity.geo }
  if (entity.openingHours?.length) {
    localBusiness.openingHoursSpecification = entity.openingHours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      ...hours,
    }))
  }
  return localBusiness
}

export function buildBreadcrumbList(path: string, breadcrumbs: BreadcrumbInput[]): BreadcrumbListNode {
  return {
    "@type": "BreadcrumbList",
    "@id": stableId(path, "breadcrumb"),
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: breadcrumb.label,
      item: canonicalUrl(breadcrumb.href),
    })),
  }
}

export function buildEntityGraph(input: PageInput): EntityGraph {
  const nodes: EntityNode[] = [
    buildOrganization(),
    buildWebSite(),
    buildWebPage(input.path, input.title, input.description),
  ]
  if (input.service) nodes.push(buildService(input.service))
  const localBusiness = input.localBusiness ? buildLocalBusiness(input.localBusiness) : null
  if (localBusiness) nodes.push(localBusiness)
  if (input.breadcrumbs?.length) nodes.push(buildBreadcrumbList(input.path, input.breadcrumbs))
  return { "@context": "https://schema.org", "@graph": nodes }
}

export function buildPageEntityGraph(path: keyof typeof SEO_ROUTE_METADATA, breadcrumbs: BreadcrumbInput[]): EntityGraph {
  const metadata = SEO_ROUTE_METADATA[path]
  return buildEntityGraph({ path, title: metadata.title, description: metadata.description, breadcrumbs })
}

export function buildServicePageEntityGraph(slug: string, breadcrumbs: BreadcrumbInput[]): EntityGraph | null {
  const service = services.find((candidate) => candidate.slug === slug)
  if (!service) return null
  const path = `/services/${service.slug}`
  return buildEntityGraph({
    path,
    title: `${service.title} in Peoria & Central Illinois`,
    description: service.short,
    service,
    breadcrumbs,
  })
}

export function serializeJsonLd(graph: EntityGraph): string {
  return JSON.stringify(graph)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}
