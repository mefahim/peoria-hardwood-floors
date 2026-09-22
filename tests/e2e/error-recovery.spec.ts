// Phase 8 — Testing: Error recovery (07-PHASE-ERROR-RECOVERY.md, 08-PHASE-TESTING.md §31,§36)
// Standalone generation-error/timeout coverage (independent of Retry, which
// already covers the ...->Retry->Success half of these in tests/e2e/retry.spec.ts),
// plus error accessibility and input-preservation assertions.
//
// NOT included here (see tests/e2e/README.md "Known limitations"): a fully
// automated, CI-repeatable trigger for (a) the Visualizer error.tsx boundary
// and (b) the Phase 7 unknown-error/stuck-loading catch branch. Both require
// forcing a genuine unexpected runtime exception; the only way to do that
// deterministically is a source-level crash hook, and 08-PHASE-TESTING.md §82
// explicitly forbids leaving test-only crash hooks in production code. Both
// were verified live instead, using the temporary-hook-then-fully-revert
// technique 08-PHASE-TESTING.md §84 describes for exactly this situation
// ("intentionally trigger a controlled component error in a test
// environment... do not use production user flows") — see the Phase 8
// completion report's Browser Tests section for that live verification.

import { expect, test } from "@playwright/test"
import { mockProvider, selectOptions, uploadValidImage } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await page.goto("/visualizer")
  await uploadValidImage(page)
  await selectOptions(page)
})

test("generation error: user-safe message, input preserved, no stuck loading, Retry available", async ({ page }) => {
  await mockProvider(page, "error")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()

  const errorAlert = page.getByRole("alert").filter({ hasText: "We couldn't generate the visualization right now" })
  await expect(errorAlert).toBeVisible({ timeout: 3000 })
  await expect(page.getByText("Creating your floor visualization…")).toHaveCount(0)

  // Input preserved — Kitchen/Light natural/Oak/etc. still selected.
  await expect(page.getByRole("group", { name: "Room type" }).getByRole("button", { name: "Kitchen" })).toHaveAttribute("aria-pressed", "true")

  const generateBtn = page.getByRole("button", { name: "Create my floor visualization" })
  await expect(generateBtn).toBeEnabled()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled()
})

test("timeout: loading stops, correct message, no false success, Retry available", async ({ page }) => {
  test.setTimeout(30_000)
  await mockProvider(page, "timeout")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByText("Creating your floor visualization…").first()).toBeVisible()

  const timeoutAlert = page.getByRole("alert").filter({ hasText: "taking longer than expected" })
  await expect(timeoutAlert).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText("Creating your floor visualization…")).toHaveCount(0)
  // No false success — no "Mock generated visualization" label after a timeout.
  await expect(page.getByText(/mock generated visualization/i)).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled()
})

test("malformed provider success (missing result) is treated as an error, never a false success", async ({ page }) => {
  await mockProvider(page, "malformed_success")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByText(/mock generated visualization/i)).toHaveCount(0, { timeout: 4000 })
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled({ timeout: 4000 })
})

test("error alerts are accessible: role=alert and readable text, not color-only", async ({ page }) => {
  await mockProvider(page, "error")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  const alert = page.getByRole("alert").filter({ hasText: "We couldn't generate" })
  await expect(alert).toBeVisible({ timeout: 3000 })
  await expect(alert).toHaveText(/./) // has real readable text content, not just an icon
})

test("generation error does not clear other valid state (result area, upload) when it happens", async ({ page }) => {
  await mockProvider(page, "error")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("alert").filter({ hasText: "We couldn't generate" })).toBeVisible({ timeout: 3000 })
  // The uploaded photo preview is still intact underneath the error.
  await expect(page.getByAltText("Preview of your uploaded room photo")).toBeVisible()
})
