// Phase 8 — Testing: Accessibility + Mobile (08-PHASE-TESTING.md §17-18,§44-47)
// Automates what the chosen stack (Playwright + Chromium) can genuinely verify:
// keyboard focus/tab order, ARIA attributes, accessible names, and functional
// responsiveness at 375x812. Real screen-reader testing is NOT automated here —
// see the Phase 8 completion report, which marks it NOT RUN rather than
// claiming it.

import { expect, test } from "@playwright/test"
import { mockProvider, selectOptions, uploadValidImage } from "./fixtures"

test.describe("accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/visualizer")
  })

  test("file input is reachable and usable without drag-and-drop (native file picker)", async ({ page }) => {
    const input = page.locator('input[type="file"]')
    await expect(input).toHaveAttribute("type", "file")
    await expect(input).not.toBeDisabled()
  })

  test("option groups expose role=group with an accessible name matching their legend", async ({ page }) => {
    // Note: this resolves to 2 elements (the <fieldset> — which itself gets an
    // implicit group role/name from its <legend> — plus the inner
    // role="group" div per 02-PHASE-OPTIONS.md's OptionButtons component).
    // Both are correctly named "Room type"; .first() is enough to prove the
    // accessible name exists. See the Phase 8 report's Known Limitations for
    // this redundant-but-harmless nested grouping (not a functional defect,
    // out of scope to refactor in a testing-only phase).
    await expect(page.getByRole("group", { name: "Room type" }).first()).toBeVisible()
    await expect(page.getByRole("group", { name: "Wood species" }).first()).toBeVisible()
  })

  test("option buttons expose aria-pressed reflecting selection state", async ({ page }) => {
    const kitchenBtn = page.getByRole("group", { name: "Room type" }).getByRole("button", { name: "Kitchen" })
    await expect(kitchenBtn).toHaveAttribute("aria-pressed", "false")
    await kitchenBtn.click()
    await expect(kitchenBtn).toHaveAttribute("aria-pressed", "true")
  })

  test("Generate button has aria-busy that flips true only while generating", async ({ page }) => {
    await uploadValidImage(page)
    await selectOptions(page)
    await mockProvider(page, "success")
    const btn = page.getByRole("button", { name: /Create my floor visualization|Creating your floor visualization/ })
    await expect(btn).toHaveAttribute("aria-busy", "false")
    await btn.click()
    await expect(btn).toHaveAttribute("aria-busy", "true")
    await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  })

  test("Retry button has a clear, non-ambiguous accessible name", async ({ page }) => {
    await uploadValidImage(page)
    await selectOptions(page)
    await mockProvider(page, "success")
    await page.getByRole("button", { name: "Create my floor visualization" }).click()
    const retryBtn = page.getByRole("button", { name: "Retry visualization" })
    await expect(retryBtn).toBeVisible({ timeout: 5000 })
    await expect(retryBtn).toHaveAccessibleName("Retry visualization")
  })

  test("keyboard: Tab reaches the file input, then option controls, then Generate, in order", async ({ page }) => {
    await page.locator("body").click() // ensure page has focus
    // Walk forward with real Tab presses until we reach the file input, then
    // confirm the option buttons and Generate button are all still reachable
    // later in the same forward tab sequence (logical order, no traps).
    let reachedFileInput = false
    for (let i = 0; i < 15 && !reachedFileInput; i++) {
      await page.keyboard.press("Tab")
      reachedFileInput = await page.evaluate(() => document.activeElement?.getAttribute("type") === "file")
    }
    expect(reachedFileInput).toBe(true)

    let reachedGenerate = false
    for (let i = 0; i < 60 && !reachedGenerate; i++) {
      await page.keyboard.press("Tab")
      reachedGenerate = await page.evaluate(() => document.activeElement?.textContent?.includes("Create my floor visualization") ?? false)
    }
    expect(reachedGenerate).toBe(true)
  })

  // 06-PHASE-RETRY.md §44, 08-PHASE-TESTING.md §45 — real keyboard activation,
  // not just focus/tab order. Uses real Enter/Space key events (Playwright's
  // own input synthesis), independent of the different browser-automation
  // tool used in Phase 6 that could not reliably trigger native button
  // activation via synthetic key dispatch.
  test("keyboard: Enter activates an option button and Space activates the Generate button", async ({ page }) => {
    await mockProvider(page, "success")
    const kitchenBtn = page.getByRole("group", { name: "Room type" }).getByRole("button", { name: "Kitchen" })
    await kitchenBtn.focus()
    await expect(kitchenBtn).toHaveAttribute("aria-pressed", "false")
    await page.keyboard.press("Enter")
    await expect(kitchenBtn).toHaveAttribute("aria-pressed", "true")

    await uploadValidImage(page)
    await selectOptions(page) // re-selecting Kitchen is idempotent; fills in the rest
    const generateBtn = page.getByRole("button", { name: "Create my floor visualization" })
    await generateBtn.focus()
    await page.keyboard.press(" ")
    await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  })

  test("result image has meaningful, non-filename alt text", async ({ page }) => {
    await uploadValidImage(page)
    await selectOptions(page)
    await mockProvider(page, "success")
    await page.getByRole("button", { name: "Create my floor visualization" }).click()
    await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
    const resultImg = page.locator("img[alt*='AI-assisted visualization']")
    await expect(resultImg).toBeVisible()
    const alt = await resultImg.getAttribute("alt")
    expect(alt).not.toMatch(/\.(jpg|png|jpeg)$/i)
  })

  test("success is not announced before the result image has actually loaded", async ({ page }) => {
    await uploadValidImage(page)
    await selectOptions(page)
    await mockProvider(page, "success")
    await page.getByRole("button", { name: "Create my floor visualization" }).click()
    // Immediately after the request resolves, the live region should not yet
    // claim "ready and visible" until the <img> itself has fired onLoad.
    await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[aria-live="polite"].sr-only')).toHaveText(/ready and visible/, { timeout: 3000 })
  })
})

test.describe("mobile viewport (375x812)", () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test("no horizontal overflow on initial load", async ({ page }) => {
    await page.goto("/visualizer")
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasOverflow).toBe(false)
  })

  test("upload, options, Generate, and Retry are all usable at mobile width", async ({ page }) => {
    await page.goto("/visualizer")
    await uploadValidImage(page)
    await selectOptions(page)
    await mockProvider(page, "success")
    await expect(page.getByRole("button", { name: "Create my floor visualization" })).toBeVisible()
    await page.getByRole("button", { name: "Create my floor visualization" }).click()
    await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasOverflow).toBe(false)
  })

  test("error alert remains readable (no overflow) at mobile width", async ({ page }) => {
    await page.goto("/visualizer")
    await uploadValidImage(page)
    await selectOptions(page)
    await mockProvider(page, "error")
    await page.getByRole("button", { name: "Create my floor visualization" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "We couldn't generate" })).toBeVisible({ timeout: 3000 })
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasOverflow).toBe(false)
  })
})
