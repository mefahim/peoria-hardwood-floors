import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { services } from "@/lib/site"
import { canonicalUrl } from "@/lib/seo/resolver"
import {
  businessEntity,
  buildLocalInternalLinks,
  canPublishLocalBusiness,
  isLocationPublishable,
  locationCanonical,
  locationLocalBusinessId,
  locationSitemapEntries,
  locationRecords,
  serviceAreaRecords,
  serviceAreaStatement,
  type BusinessEntitySettings,
  type LocationRecord,
} from "@/lib/seo/local"
import { buildLocalBusiness, buildOrganization, buildService } from "@/lib/seo/structured-data"

const verifiedBusiness: BusinessEntitySettings = {
  ...businessEntity,
  address: {
    streetAddress: "123 Verified Street",
    addressLocality: "Peoria",
    addressRegion: "IL",
    postalCode: "61601",
    addressCountry: "US",
  },
  businessType: "LocalBusiness",
}

const eligibleLocation = (slug: string): LocationRecord => ({
  name: slug,
  slug,
  verified: true,
  pageEligible: true,
  uniqueContentReady: true,
  hasRealServiceContext: true,
  indexable: true,
  serviceSlugs: [services[0].slug],
  verificationState: "verified",
})

describe("local SEO and business entity expansion", () => {
  it("keeps the current business as Organization when no verified address exists", () => {
    expect(canPublishLocalBusiness(businessEntity)).toBe(false)
    expect(buildLocalBusiness(businessEntity)).toBeNull()
    expect(buildOrganization()).not.toHaveProperty("address")
  })

  it("allows a fully verified business to emit a validated LocalBusiness", () => {
    const localBusiness = buildLocalBusiness(verifiedBusiness)
    expect(localBusiness?.["@type"]).toBe("LocalBusiness")
    expect(localBusiness?.address.addressCountry).toBe("US")
    expect(localBusiness).not.toHaveProperty("aggregateRating")
    expect(localBusiness).not.toHaveProperty("review")
    expect(localBusiness).not.toHaveProperty("award")
    expect(localBusiness).not.toHaveProperty("memberOf")
  })

  it("omits unverified address, hours, GBP, and social profiles", () => {
    expect(buildLocalBusiness({ ...verifiedBusiness, verificationState: "pending_verification" })).toBeNull()
    const current = buildLocalBusiness(businessEntity)
    expect(current).toBeNull()
    expect(JSON.stringify(businessEntity)).not.toContain("googleBusinessProfileUrl")
    expect(JSON.stringify(businessEntity)).not.toContain("socialProfiles")
  })

  it("does not turn the radius statement into fake cities or GeoCircle schema", () => {
    expect(serviceAreaStatement).toBe("within roughly 75 miles of Peoria, Illinois")
    expect(serviceAreaRecords).toHaveLength(0)
    expect(JSON.stringify(businessEntity)).not.toContain("GeoCircle")
  })

  it("requires every location publication gate", () => {
    const location = eligibleLocation("peoria")
    expect(isLocationPublishable(location)).toBe(true)
    for (const key of ["verified", "pageEligible", "uniqueContentReady", "hasRealServiceContext", "indexable"] as const) {
      expect(isLocationPublishable({ ...location, [key]: false })).toBe(false)
    }
    expect(isLocationPublishable({ ...location, verificationState: "draft" })).toBe(false)
  })

  it("does not publish current unverified locations or drafts to the sitemap", () => {
    expect(locationRecords).toHaveLength(0)
    expect(locationSitemapEntries(locationRecords)).toEqual([])
    expect(locationSitemapEntries([eligibleLocation("peoria"), { ...eligibleLocation("draft-town"), verificationState: "draft" }])).toEqual([
      { url: "https://peoriahardwoodfloors.com/locations/peoria", changeFrequency: "monthly", priority: 0.6 },
    ])
    expect(sitemap().some((entry) => entry.url.includes("/locations/"))).toBe(false)
  })

  it("uses the Phase 02 canonical resolver for location paths and IDs", () => {
    const location = eligibleLocation("peoria")
    expect(locationCanonical(location)).toBe(canonicalUrl("/locations/peoria"))
    expect(locationLocalBusinessId(location)).toBe("https://peoriahardwoodfloors.com/locations/peoria#localbusiness")
    expect(() => locationCanonical({ ...location, slug: "Peoria?utm_source=fake" })).toThrow()
  })

  it("does not reuse a LocalBusiness ID between eligible locations", () => {
    const first = locationLocalBusinessId(eligibleLocation("peoria"))
    const second = locationLocalBusinessId(eligibleLocation("galesburg"))
    expect(first).not.toBe(second)
  })

  it("builds only useful canonical internal links for publishable locations", () => {
    const links = buildLocalInternalLinks(eligibleLocation("peoria"))
    expect(links.length).toBeGreaterThan(0)
    expect(links.every((link) => link.href.startsWith("https://peoriahardwoodfloors.com/"))).toBe(true)
    expect(buildLocalInternalLinks({ ...eligibleLocation("draft-town"), indexable: false })).toEqual([])
  })

  it("preserves the six centralized service records", () => {
    expect(services).toHaveLength(6)
    for (const service of services) expect(buildService(service).name).toBe(service.title)
  })
})
