// Phase 8 — Testing: Options (visualizer-docs/08-PHASE-TESTING.md §13, §6 in 02-PHASE-OPTIONS.md)
// Tests lib/visualizer/options.ts — the single canonical source for every
// option group's internal values/labels and the square-footage normalizer.

import { describe, expect, it } from "vitest"
import {
  CUSTOM_STYLE_VALUE,
  FINISH_PREFERENCE_OPTIONS,
  FLOOR_DIRECTION_OPTIONS,
  INITIAL_VISUALIZER_OPTIONS,
  PREFERRED_STYLE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SERVICE_CITY_OPTIONS,
  SHEEN_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  normalizeSquareFootageInput,
} from "@/lib/visualizer/options"

const OPTION_GROUPS = {
  ROOM_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PREFERRED_STYLE_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  FLOOR_DIRECTION_OPTIONS,
  FINISH_PREFERENCE_OPTIONS,
  SHEEN_OPTIONS,
} as const

describe("canonical option groups", () => {
  it("every group is non-empty and every option has a stable internal value distinct from its label source", () => {
    for (const [groupName, group] of Object.entries(OPTION_GROUPS)) {
      expect(group.length, `${groupName} should not be empty`).toBeGreaterThan(0)
      for (const option of group) {
        expect(typeof option.value, `${groupName} value`).toBe("string")
        expect(option.value.length, `${groupName} value non-empty`).toBeGreaterThan(0)
        expect(typeof option.label, `${groupName} label`).toBe("string")
        expect(option.label.length, `${groupName} label non-empty`).toBeGreaterThan(0)
      }
    }
  })

  it("every group has unique internal values (no accidental duplicate option)", () => {
    for (const [groupName, group] of Object.entries(OPTION_GROUPS)) {
      const values = group.map((o) => o.value)
      expect(new Set(values).size, `${groupName} duplicate values`).toBe(values.length)
    }
  })

  // 02-PHASE-OPTIONS.md §16 — internal values use snake_case identifiers, not
  // the human-readable label, so the UI never treats a label as a business ID.
  it("internal values are snake_case identifiers, never the display label verbatim", () => {
    for (const [groupName, group] of Object.entries(OPTION_GROUPS)) {
      for (const option of group) {
        expect(option.value, `${groupName}:${option.value}`).toMatch(/^[a-z0-9_]+$/)
      }
    }
  })

  // "unsure" is an explicitly allowed value on several groups (03-PHASE-VALIDATION.md §17).
  it("floorDirection, finishPreference, and sheen each allow an explicit 'unsure' value", () => {
    expect(FLOOR_DIRECTION_OPTIONS.some((o) => o.value === "unsure")).toBe(true)
    expect(FINISH_PREFERENCE_OPTIONS.some((o) => o.value === "unsure")).toBe(true)
    expect(SHEEN_OPTIONS.some((o) => o.value === "unsure")).toBe(true)
  })

  it("CUSTOM_STYLE_VALUE matches an actual entry in PREFERRED_STYLE_OPTIONS", () => {
    expect(PREFERRED_STYLE_OPTIONS.some((o) => o.value === CUSTOM_STYLE_VALUE)).toBe(true)
  })

  it("SERVICE_CITY_OPTIONS is derived from lib/site.ts and produces stable, unique slugs", () => {
    expect(SERVICE_CITY_OPTIONS.length).toBeGreaterThan(0)
    const values = SERVICE_CITY_OPTIONS.map((o) => o.value)
    expect(new Set(values).size).toBe(values.length)
    for (const option of SERVICE_CITY_OPTIONS) {
      expect(option.value).toMatch(/^[a-z0-9_]+$/)
    }
  })
})

describe("INITIAL_VISUALIZER_OPTIONS", () => {
  it("starts every required field unset (null) and customStyleDescription empty", () => {
    expect(INITIAL_VISUALIZER_OPTIONS.roomType).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.projectType).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.preferredStyle).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.woodSpecies).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.floorDirection).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.finishPreference).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.sheen).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.serviceCity).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.squareFootage).toBeNull()
    expect(INITIAL_VISUALIZER_OPTIONS.customStyleDescription).toBe("")
  })
})

describe("normalizeSquareFootageInput", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["1200", 1200],
    [" 1200 ", 1200],
    ["0", null],
    ["-100", null],
    ["abc", null],
    ["NaN", null],
    ["Infinity", null],
    ["-Infinity", null],
    ["1200.5", 1200.5],
  ])("normalizeSquareFootageInput(%j) -> %j", (input, expected) => {
    expect(normalizeSquareFootageInput(input)).toBe(expected)
  })
})
