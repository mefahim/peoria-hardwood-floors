import { canonicalUrl, PRODUCTION_ORIGIN } from "@/lib/seo/resolver"
import { site } from "@/lib/site"

export type VerificationState = "draft" | "pending_verification" | "verified" | "rejected" | "archived"

export type Address = {
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string
}

export type GeoCoordinates = {
  latitude: number
  longitude: number
}

export type OpeningHours = {
  dayOfWeek: string
  opens: string
  closes: string
}

export type BusinessType = "LocalBusiness" | "HomeAndConstructionBusiness" | "Contractor"

export type BusinessEntitySettings = {
  name: string
  url: string
  phone: string
  email: string
  description: string
  verificationState: VerificationState
  address?: Address
  geo?: GeoCoordinates
  openingHours?: OpeningHours[]
  googleBusinessProfileUrl?: string
  socialProfiles?: string[]
  businessType?: BusinessType
}

export type ServiceAreaType = "city" | "county" | "zip" | "region" | "radius"

export type ServiceAreaRecord = {
  name: string
  type: ServiceAreaType
  region?: string
  parent?: string
  slug?: string
  verified: boolean
  pageEligible: boolean
}

export type LocationRecord = {
  name: string
  slug: string
  verified: boolean
  pageEligible: boolean
  uniqueContentReady: boolean
  hasRealServiceContext: boolean
  indexable: boolean
  serviceSlugs: string[]
  verificationState: VerificationState
}

export type LocalInternalLink = {
  label: string
  href: string
  source: "homepage" | "service" | "location"
  destination: "services" | "location" | "contact" | "estimate" | "service"
}

export const businessEntity: BusinessEntitySettings = {
  name: site.name,
  url: PRODUCTION_ORIGIN,
  phone: site.phoneHref.replace(/^tel:/, ""),
  email: site.email,
  description: site.tagline,
  verificationState: "verified",
}

export const serviceAreaStatement = site.serviceRadius

// The supplied project contains a radius statement, not a verified city/county/ZIP list.
// Keep this collection empty until individual service-area records are explicitly verified.
export const serviceAreaRecords: readonly ServiceAreaRecord[] = []

// No location record is currently verified and content-ready for publication.
export const locationRecords: readonly LocationRecord[] = []

export function isVerifiedBusinessEntity(entity: BusinessEntitySettings): boolean {
  return entity.verificationState === "verified" && entity.name.trim().length > 0 && entity.url === PRODUCTION_ORIGIN && entity.phone.trim().length > 0 && entity.email.trim().length > 0
}

export function isValidAddress(address: Address): boolean {
  return [address.streetAddress, address.addressLocality, address.addressRegion, address.postalCode, address.addressCountry].every((value) => value.trim().length > 0) && /^[A-Z]{2}$/i.test(address.addressCountry.trim())
}

export function isValidBusinessType(type: BusinessType | undefined): type is BusinessType {
  return type === "LocalBusiness" || type === "HomeAndConstructionBusiness" || type === "Contractor"
}

export function canPublishLocalBusiness(entity: BusinessEntitySettings): boolean {
  return isVerifiedBusinessEntity(entity) && Boolean(entity.address && isValidAddress(entity.address)) && isValidBusinessType(entity.businessType)
}

export function isLocationPublishable(location: LocationRecord): boolean {
  return location.verificationState === "verified" && location.verified && location.pageEligible && location.uniqueContentReady && location.hasRealServiceContext && location.indexable
}

export function locationPath(location: LocationRecord): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(location.slug)) throw new Error("Location slug must be lowercase slug-safe text.")
  return `/locations/${location.slug}`
}

export function locationCanonical(location: LocationRecord): string {
  return canonicalUrl(locationPath(location))
}

export function locationLocalBusinessId(location: LocationRecord): string | null {
  return isLocationPublishable(location) ? `${locationCanonical(location)}#localbusiness` : null
}

export function locationSitemapEntries(locations: readonly LocationRecord[]): { url: string; changeFrequency: "monthly"; priority: number }[] {
  return locations.filter(isLocationPublishable).map((location) => ({ url: locationCanonical(location), changeFrequency: "monthly", priority: 0.6 }))
}

export function buildLocalInternalLinks(location: LocationRecord): LocalInternalLink[] {
  if (!isLocationPublishable(location)) return []
  return [
    { label: "Explore our services", href: canonicalUrl("/services"), source: "location", destination: "services" },
    { label: "Talk through your project", href: canonicalUrl("/contact"), source: "location", destination: "contact" },
    ...location.serviceSlugs.map((slug) => ({ label: "View related service", href: canonicalUrl(`/services/${slug}`), source: "location" as const, destination: "service" as const })),
  ]
}
