import { describe, expect, it } from "vitest"
import { normalizeEmail, validateLeadForm } from "@/lib/visualizer/lead-validation"

describe("validateLeadForm", () => {
  it("accepts a valid submission with all fields", () => {
    const result = validateLeadForm({ name: "Jane Doe", email: "Jane@Example.com", phone: "(309) 555-1234" })
    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ name: "Jane Doe", email: "jane@example.com", phone: "(309) 555-1234" })
  })

  it("accepts a valid submission with phone omitted", () => {
    const result = validateLeadForm({ name: "Jane Doe", email: "jane@example.com" })
    expect(result.valid).toBe(true)
    expect(result.data?.phone).toBeNull()
  })

  it("requires name", () => {
    const result = validateLeadForm({ name: "", email: "jane@example.com" })
    expect(result.valid).toBe(false)
    expect(result.errors.name?.code).toBe("FIELD_REQUIRED")
  })

  it("requires email", () => {
    const result = validateLeadForm({ name: "Jane", email: "" })
    expect(result.valid).toBe(false)
    expect(result.errors.email?.code).toBe("FIELD_REQUIRED")
  })

  it("rejects a malformed email", () => {
    const result = validateLeadForm({ name: "Jane", email: "not-an-email" })
    expect(result.valid).toBe(false)
    expect(result.errors.email?.code).toBe("INVALID_FORMAT")
  })

  it("rejects a too-short phone number but keeps the rest valid", () => {
    const result = validateLeadForm({ name: "Jane", email: "jane@example.com", phone: "123" })
    expect(result.valid).toBe(false)
    expect(result.errors.phone?.code).toBe("INVALID_FORMAT")
  })

  it("collects every field error in one pass", () => {
    const result = validateLeadForm({ name: "", email: "bad", phone: "1" })
    expect(Object.keys(result.errors).sort()).toEqual(["email", "name", "phone"])
  })

  it("treats non-string input as empty rather than throwing", () => {
    const result = validateLeadForm({ name: undefined, email: 42 })
    expect(result.valid).toBe(false)
    expect(result.errors.name?.code).toBe("FIELD_REQUIRED")
    expect(result.errors.email?.code).toBe("FIELD_REQUIRED")
  })
})

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Jane@Example.COM  ")).toBe("jane@example.com")
  })

  it("does not alter the local part beyond case (no Gmail dot/plus-tag stripping)", () => {
    expect(normalizeEmail("Jane.Doe+promo@Example.com")).toBe("jane.doe+promo@example.com")
  })
})
