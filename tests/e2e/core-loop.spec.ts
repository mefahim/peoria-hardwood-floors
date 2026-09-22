// Phase 8 — Testing: Core loop E2E (visualizer-docs/08-PHASE-TESTING.md §32-35, §22-27)
// The primary happy path plus upload/validation E2E behavior, against the
// real running app (no mocked React internals — only the network boundary to
// the mock provider is controlled, via the existing dev-only header).

import { expect, test } from "@playwright/test"
import { mockProvider, selectOptions, uploadValidImage } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await page.goto("/visualizer")
})

test("TC-32 — primary happy path: upload, all options, Generate, result appears", async ({ page }) => {
  await mockProvider(page, "success")
  await uploadValidImage(page)
  await expect(page.getByText(/Selected: room\.png/)).toBeVisible()

  await selectOptions(page)

  let postCount = 0
  page.on("request", (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") postCount++
  })

  const consoleErrors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })

  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByText("Creating your floor visualization…").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  await expect(page.getByText("Creating your floor visualization…")).toHaveCount(0)
  expect(postCount).toBe(1)

  // No unexpected console errors during the happy path.
  expect(consoleErrors).toEqual([])
})

test("TC-35 — invalid replacement image preserves the existing valid image (UPL-007/ERR-008)", async ({ page }) => {
  await uploadValidImage(page, { name: "valid-first.png" })
  await expect(page.getByText(/Selected: valid-first\.png/)).toBeVisible()

  // Replace with an unsupported file type.
  await page.locator('input[type="file"]').setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })

  await expect(page.getByText("This file type isn't supported. Please upload a JPG, PNG, or WebP image.")).toBeVisible()
  // The ORIGINAL valid image is still the active one — never silently destroyed.
  await expect(page.getByText(/Selected: valid-first\.png/)).toBeVisible()
})

test("TC-34 — missing required options: zero provider calls, scoped field errors, then recovers", async ({ page }) => {
  await mockProvider(page, "success")
  await uploadValidImage(page)

  let postCount = 0
  page.on("request", (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") postCount++
  })

  await page.getByRole("button", { name: "Create my floor visualization" }).click()

  await expect(page.getByText("Please choose a room type.")).toBeVisible()
  await expect(page.getByText("Please choose a project type.")).toBeVisible()
  await expect(page.getByText("Please choose a wood species.")).toBeVisible()
  expect(postCount).toBe(0)

  // VAL scope — fixing ONE field clears only that field's error.
  await page.getByRole("group", { name: "Room type" }).getByRole("button", { name: "Kitchen", exact: true }).click()
  await expect(page.getByText("Please choose a room type.")).toHaveCount(0)
  await expect(page.getByText("Please choose a project type.")).toBeVisible()

  await selectOptions(page)
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  expect(postCount).toBe(1)
})

test("TC-33 — custom style requires a description before Generate proceeds", async ({ page }) => {
  await mockProvider(page, "success")
  await uploadValidImage(page)
  await selectOptions(page, { preferredStyle: "Custom" })

  let postCount = 0
  page.on("request", (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") postCount++
  })

  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByText("Please describe the style you want.")).toBeVisible()
  expect(postCount).toBe(0)

  await page.getByLabel("Describe the style you want").fill("Warm medium-brown oak with a matte finish")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  expect(postCount).toBe(1)
})

test("original photo thumbnail remains visible after a successful result (source preserved)", async ({ page }) => {
  await mockProvider(page, "success")
  await uploadValidImage(page)
  await selectOptions(page)
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })
  await expect(page.getByAltText("Your original uploaded room photo, unchanged")).toBeVisible()
})
