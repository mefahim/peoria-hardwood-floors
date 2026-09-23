import { describe, expect, it } from "vitest"
import { authorizeDashboardAccess, isDashboardRole } from "@/lib/admin/authorization"
import { INTERACTIVE_ROUTE_POLICY, PUBLIC_STATIC_ROUTES } from "@/lib/seo/resolver"
import { services } from "@/lib/site"

describe("SEO dashboard foundation", () => {
  it("allows only authenticated allowlisted roles to view the dashboard", () => {
    expect(authorizeDashboardAccess({ authenticated: true, role: "Admin" }, "view", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: true, role: "SEO Manager" }, "view", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: false, role: "Admin" }, "view", "seo-dashboard")).toBe(false)
    expect(authorizeDashboardAccess({ authenticated: true, role: null }, "view", "seo-dashboard")).toBe(false)
    expect(authorizeDashboardAccess({ authenticated: true, role: "Unknown" as never }, "view", "seo-dashboard")).toBe(false)
  })

  it("rejects unknown roles rather than defaulting to access", () => {
    expect(isDashboardRole("Admin")).toBe(true)
    expect(isDashboardRole("Reviewer")).toBe(true)
    expect(isDashboardRole("owner")).toBe(false)
    expect(isDashboardRole(undefined)).toBe(false)
  })

  it("preserves the public SEO route boundary and utility noindex policy", () => {
    expect(PUBLIC_STATIC_ROUTES).toContain("/")
    expect(PUBLIC_STATIC_ROUTES).toContain("/services")
    expect(services).toHaveLength(6)
    expect(INTERACTIVE_ROUTE_POLICY["/visualizer"].indexable).toBe(false)
    expect(INTERACTIVE_ROUTE_POLICY["/estimate-calculator"].indexable).toBe(false)
  })
})
