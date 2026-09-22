// Phase 8 — Testing: Result (08-PHASE-TESTING.md, RES-TEST-*)
// Tests lib/visualizer/result.ts — the result-image reference safety check and
// the dynamic alt-text builder.

import { describe, expect, it } from "vitest"
import { buildResultAltText, isUsableResultImageReference } from "@/lib/visualizer/result"
import type { VisualizerOptions } from "@/lib/visualizer/options"

describe("isUsableResultImageReference", () => {
  it.each([
    ["/images/hero-kitchen.png", true],
    ["https://example.com/x.png", true],
    ["http://example.com/x.png", true],
    ["blob:http://localhost:3000/abc-123", true],
    ["data:image/png;base64,AAAA", true],
    ["", false],
    ["   ", false],
    [null, false],
    [undefined, false],
    [12345, false],
    ["javascript:alert(1)", false],
    ["vbscript:msgbox(1)", false],
    ["file:///etc/passwd", false],
    ["//evil.example.com/x.png", false],
    ["data:text/html,<script>alert(1)</script>", false],
    ["not-a-url-at-all", false],
  ])("isUsableResultImageReference(%j) -> %s", (input, expected) => {
    expect(isUsableResultImageReference(input)).toBe(expected)
  })
})

const sampleOptions: VisualizerOptions = {
  roomType: "kitchen",
  projectType: "new_installation",
  preferredStyle: "warm_traditional",
  customStyleDescription: "",
  woodSpecies: "oak",
  floorDirection: "parallel",
  finishPreference: "bona_traffic_hd",
  sheen: "satin",
  serviceCity: null,
  squareFootage: null,
}

describe("buildResultAltText", () => {
  it("includes the style, wood, and room labels — never a bare filename", () => {
    const alt = buildResultAltText(sampleOptions)
    expect(alt).toContain("Warm")
    expect(alt).toContain("Oak")
    expect(alt.toLowerCase()).toContain("kitchen")
    expect(alt).not.toMatch(/\.(jpg|png|jpeg)$/i)
  })

  it("returns a safe, non-empty fallback for null options", () => {
    const alt = buildResultAltText(null)
    expect(alt.length).toBeGreaterThan(0)
  })

  it("never throws for an unknown/invalid enum value in options", () => {
    expect(() => buildResultAltText({ ...sampleOptions, roomType: "totally_unknown_value" } as unknown as VisualizerOptions)).not.toThrow()
  })

  it("produces different alt text for different style/wood combinations (not a static string)", () => {
    const a = buildResultAltText(sampleOptions)
    const b = buildResultAltText({ ...sampleOptions, preferredStyle: "dark_modern", woodSpecies: "hickory" })
    expect(a).not.toBe(b)
  })
})
