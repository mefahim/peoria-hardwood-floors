// Phase 8 — Testing: Concurrency / duplicate-action protection
// (04-PHASE-GENERATE.md §21-23, 06-PHASE-RETRY.md §25-27, 08-PHASE-TESTING.md §15,§40)

import { expect, test } from "@playwright/test"
import { clickButtonRapidly, mockProvider, selectOptions, uploadValidImage } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await page.goto("/visualizer")
  await uploadValidImage(page)
  await selectOptions(page)
})

test("double-click Generate produces exactly one request", async ({ page }) => {
  await mockProvider(page, "success")
  let postCount = 0
  page.on("request", (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") postCount++
  })

  await clickButtonRapidly(page, "Create my floor visualization", 2)
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  expect(postCount).toBe(1)
})

test("triple-click Generate produces exactly one request", async ({ page }) => {
  await mockProvider(page, "success")
  let postCount = 0
  page.on("request", (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") postCount++
  })

  await clickButtonRapidly(page, "Create my floor visualization", 3)
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  expect(postCount).toBe(1)
})

test("Generate is disabled for the full duration of an active attempt (no window for a second click to matter)", async ({ page }) => {
  await mockProvider(page, "timeout")
  test.setTimeout(30_000)
  const btn = page.getByRole("button", { name: /Create my floor visualization|Creating your floor visualization/ })
  await btn.click()
  await expect(btn).toBeDisabled()
  await expect(page.getByRole("alert").filter({ hasText: "taking longer than expected" })).toBeVisible({ timeout: 12_000 })
  await expect(page.getByRole("button", { name: "Create my floor visualization" })).toBeEnabled()
})
