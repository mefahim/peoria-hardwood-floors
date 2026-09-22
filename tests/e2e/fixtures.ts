// Phase 8 — Testing: E2E fixtures/helpers (visualizer-docs/08-PHASE-TESTING.md §7-9,§21)
// Small, deterministic, synthetic helpers shared across the E2E specs. No
// external websites, no real AI credentials, no production data — every image
// is generated in-browser via <canvas> and every provider outcome is driven
// by the existing dev-only mock-mode header (never exposed in production —
// see app/api/visualizer/route.ts's resolveMockMode).

import type { Page } from "@playwright/test"

export type MockMode = "success" | "error" | "timeout" | "malformed_success"

export async function makePngBuffer(page: Page, width: number, height: number, color = "#8899aa"): Promise<Buffer> {
  const base64 = await page.evaluate(
    ({ width, height, color }) => {
      return new Promise<string>((resolve, reject) => {
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("no 2d context"))
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, height)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("toBlob failed"))
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(",")[1])
          reader.onerror = () => reject(new Error("FileReader failed"))
          reader.readAsDataURL(blob)
        }, "image/png")
      })
    },
    { width, height, color },
  )
  return Buffer.from(base64, "base64")
}

export async function uploadValidImage(page: Page, opts?: { width?: number; height?: number; name?: string }) {
  const width = opts?.width ?? 800
  const height = opts?.height ?? 600
  const name = opts?.name ?? "room.png"
  const buffer = await makePngBuffer(page, width, height)
  await page.locator('input[type="file"]').setInputFiles({ name, mimeType: "image/png", buffer })
}

export interface OptionSelection {
  roomType?: string
  projectType?: string
  preferredStyle?: string
  woodSpecies?: string
  floorDirection?: string
  finishPreference?: string
  sheen?: string
}

const DEFAULT_OPTIONS: Required<OptionSelection> = {
  roomType: "Kitchen",
  projectType: "New installation",
  preferredStyle: "Light / natural",
  woodSpecies: "Oak",
  floorDirection: "Parallel",
  finishPreference: "Bona Traffic HD",
  sheen: "Satin",
}

const LEGEND_BY_FIELD: Record<keyof OptionSelection, string> = {
  roomType: "Room type",
  projectType: "Project type",
  preferredStyle: "Preferred style",
  woodSpecies: "Wood species",
  floorDirection: "Floor direction",
  finishPreference: "Finish preference",
  sheen: "Sheen",
}

export async function selectOptions(page: Page, overrides: OptionSelection = {}) {
  const selection = { ...DEFAULT_OPTIONS, ...overrides }
  for (const field of Object.keys(LEGEND_BY_FIELD) as (keyof OptionSelection)[]) {
    const legend = LEGEND_BY_FIELD[field]
    const label = selection[field]
    await page.getByRole("group", { name: legend }).getByRole("button", { name: label, exact: true }).click()
  }
}

/**
 * Routes every /api/visualizer request through the dev-only mock-mode header
 * (never honored in production — resolveMockMode() in app/api/visualizer/route.ts
 * hard-gates it to NODE_ENV !== "production") and, when `forceBadImageUrl` is
 * set, rewrites a successful response's imageUrl to a real, non-existent path
 * so the browser's own <img> onerror genuinely fires (RES-TEST-005 / ERR-012),
 * without touching any application source.
 */
export async function mockProvider(page: Page, mode: MockMode, opts?: { forceBadImageUrl?: boolean }) {
  // Calling mockProvider() again mid-test (e.g. "timeout" then "success" for
  // a Retry) must fully replace the previous handler, not stack a second one
  // — otherwise the FIRST (slow) handler can be left with an in-flight
  // route.fetch() the test never awaits, which Playwright reports as a
  // dangling "Test ended" error attributed to whichever test happens to be
  // running when it settles.
  await page.unrouteAll({ behavior: "ignoreErrors" })
  await page.route("**/api/visualizer", async (route) => {
    try {
      const response = await route.fetch({ headers: { ...route.request().headers(), "x-mock-visualizer-mode": mode } })
      if (opts?.forceBadImageUrl) {
        const json = await response.json()
        if (json.status === "success" && json.result) json.result.imageUrl = "/images/does-not-exist-404.png"
        await route.fulfill({ response, json })
        return
      }
      await route.fulfill({ response })
    } catch {
      // The test/page can legitimately close while a slow mock request (e.g.
      // "timeout" mode's ~8s server-side wait) is still in flight — that is a
      // teardown race, not a test failure, so it's swallowed rather than left
      // to surface as an unattributed "Test ended" error on a later test.
    }
  })
}

/**
 * True duplicate-click protection can only be proven by dispatching multiple
 * clicks within a single synchronous tick — Playwright's own `Promise.all([
 * btn.click(), btn.click()])` goes through separate CDP round-trips per call
 * and does NOT guarantee sub-tick ordering, which produces false-positive
 * "duplicate request" failures unrelated to the product's actual (synchronous
 * ref-based) lock. This mirrors the technique manually proven reliable across
 * Phases 4/6/7: dispatch N real DOM `.click()` calls back-to-back inside one
 * `page.evaluate`, which the single-threaded JS event loop guarantees runs
 * click #1's handler to its first `await` before click #2 is even dispatched.
 */
export async function clickButtonRapidly(page: Page, accessibleName: string, times: number) {
  await page.evaluate(
    ({ accessibleName, times }) => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === accessibleName)
      if (!btn) throw new Error(`Button not found: ${accessibleName}`)
      for (let i = 0; i < times; i++) btn.click()
    },
    { accessibleName, times },
  )
}
