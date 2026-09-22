// Phase 8 — Testing (visualizer-docs/08-PHASE-TESTING.md §10-11, §47-49)
// Real-browser E2E configuration for the Visualizer core loop. Runs against
// the actual Next.js dev server (which is where the dev-only
// `x-mock-visualizer-mode` header — already gated off in production by
// app/api/visualizer/route.ts — is honored), reusing an already-running dev
// server when present instead of starting a second one.

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  // A single desktop project runs the whole suite. Mobile viewport coverage
  // (08-PHASE-TESTING.md §47, 375x812) is a deliberate, explicit check inside
  // tests/e2e/accessibility-mobile.spec.ts (via test.use({ viewport })) rather
  // than a second project that would silently re-run every other spec twice.
  projects: [{ name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } }],
})
