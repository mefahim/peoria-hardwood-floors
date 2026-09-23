import { describe, expect, it } from "vitest"
import { authorizeDashboardAccess } from "@/lib/admin/authorization"
import { isManagedSeoRoute, validateMutationPayload, validateSeoText } from "@/lib/seo/management"

describe("Phase 04 SEO management safety", () => {
  it("allows only existing public pages and services", () => {
    expect(isManagedSeoRoute("/")).toBe(true)
    expect(isManagedSeoRoute("/services/hardwood-floor-installation-peoria-il")).toBe(true)
    expect(isManagedSeoRoute("/admin/seo")).toBe(false)
    expect(isManagedSeoRoute("/visualizer")).toBe(false)
    expect(isManagedSeoRoute("/locations/peoria")).toBe(false)
  })

  it("validates plain-text title and description boundaries", () => {
    expect(validateSeoText("title", "  Safe title  ")).toEqual({ value: "Safe title" })
    expect(validateSeoText("description", 42).error).toBeTruthy()
    expect(validateSeoText("title", "x".repeat(161)).error).toContain("160")
    expect(validateSeoText("description", "\u0000unsafe").error).toBeTruthy()
  })

  it("rejects mass assignment, unknown routes, and protected fields", () => {
    expect(validateMutationPayload({ route: "/", action: "set", fields: { title: "New", canonical: "https://evil.example" } }).error).toContain("Only title")
    expect(validateMutationPayload({ route: "/admin/seo", action: "set", fields: { title: "New" } }).error).toContain("Unknown")
    expect(validateMutationPayload({ route: "/", action: "reset" })).toEqual({ route: "/", action: "reset" })
  })

  it("allows updates only to Admin and SEO Manager", () => {
    expect(authorizeDashboardAccess({ authenticated: true, role: "Admin" }, "update", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: true, role: "SEO Manager" }, "update", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: true, role: "Reviewer" }, "update", "seo-dashboard")).toBe(false)
    expect(authorizeDashboardAccess({ authenticated: true, role: "Content Editor" }, "update", "seo-dashboard")).toBe(false)
    expect(authorizeDashboardAccess({ authenticated: false, role: "Admin" }, "update", "seo-dashboard")).toBe(false)
  })
})
