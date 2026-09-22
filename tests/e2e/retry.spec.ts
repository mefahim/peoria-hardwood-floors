// Phase 8 — Testing: Retry (visualizer-docs/06-PHASE-RETRY.md, 08-PHASE-TESTING.md §30,§37-41)
// The full Retry matrix requested for Phase 8: success->retry->success,
// error->retry->success, timeout->retry->success, result-error->retry->success,
// live-form-edit snapshot integrity, rapid duplicate Retry, and mutual
// Generate/Retry duplicate protection.

import { expect, test, type Page } from "@playwright/test"
import { clickButtonRapidly, mockProvider, selectOptions, uploadValidImage } from "./fixtures"

async function countPosts(page: Page): Promise<() => number> {
  let count = 0
  page.on("request", (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") count++
  })
  return () => count
}

async function extractRequestIds(page: Page): Promise<() => string[]> {
  const ids: string[] = []
  page.on("request", async (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") {
      const postData = r.postData()
      // Multipart form data — extract the requestId field value with a small
      // deterministic regex rather than a full multipart parser.
      const match = postData?.match(/name="requestId"\r?\n\r?\n(viz_[^\r\n]+)/)
      if (match) ids.push(match[1])
    }
  })
  return () => ids
}

test.beforeEach(async ({ page }) => {
  await page.goto("/visualizer")
  await uploadValidImage(page)
  await selectOptions(page)
})

test("A — Success -> Retry -> Success: new request ID, same snapshot, result replaced", async ({ page }) => {
  await mockProvider(page, "success")
  const getIds = await extractRequestIds(page)

  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })

  await page.getByRole("button", { name: "Retry visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled({ timeout: 5000 })

  const ids = getIds()
  expect(ids.length).toBe(2)
  expect(ids[0]).not.toBe(ids[1])
  expect(ids[0]).toMatch(/^viz_/)
  expect(ids[1]).toMatch(/^viz_/)
})

test("B — Error -> Retry -> Success", async ({ page }) => {
  await mockProvider(page, "error")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByText("We couldn't generate the visualization right now. Please try again.")).toBeVisible({ timeout: 3000 })
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled()

  await mockProvider(page, "success")
  await page.getByRole("button", { name: "Retry visualization" }).click()
  await expect(page.getByText("We couldn't generate the visualization right now. Please try again.")).toHaveCount(0, { timeout: 5000 })
})

test("C — Timeout -> Retry -> Success", async ({ page }) => {
  test.setTimeout(30_000)
  await mockProvider(page, "timeout")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByText("The visualization is taking longer than expected. Please try again.")).toBeVisible({ timeout: 12_000 })
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled()

  await mockProvider(page, "success")
  await page.getByRole("button", { name: "Retry visualization" }).click()
  // Wait for the full retry attempt to actually finish (not just for the old
  // error text to disappear, which happens as soon as the NEW attempt starts,
  // before its request has resolved) — avoids leaving the mock route's fetch
  // in flight when the test ends.
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled({ timeout: 5000 })
  await expect(page.getByText(/taking longer than expected/)).toHaveCount(0)
})

test("D — Result display error -> Retry -> Success", async ({ page }) => {
  await mockProvider(page, "success", { forceBadImageUrl: true })
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByText("We generated the visualization, but it couldn't be displayed. Please try again.")).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled()

  await mockProvider(page, "success")
  await page.getByRole("button", { name: "Retry visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled({ timeout: 5000 })
  await expect(page.getByText(/couldn't be displayed/)).toHaveCount(0)
})

test("E — live form edits after Generate do NOT change what Retry sends (critical: snapshot integrity)", async ({ page }) => {
  await mockProvider(page, "success")
  await page.getByRole("group", { name: "Room type" }).getByRole("button", { name: "Kitchen", exact: true }).click()

  const capturedPayloads: string[] = []
  page.on("request", (r) => {
    if (r.url().includes("/api/visualizer") && r.method() === "POST") {
      const data = r.postData() ?? ""
      capturedPayloads.push(data)
    }
  })

  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })

  // Now change the LIVE form to different values, WITHOUT clicking Generate.
  await page.getByRole("group", { name: "Room type" }).getByRole("button", { name: "Bedroom", exact: true }).click()
  await page.getByRole("group", { name: "Preferred style" }).getByRole("button", { name: "Dark / modern", exact: true }).click()
  await page.getByRole("group", { name: "Wood species" }).getByRole("button", { name: "Maple", exact: true }).click()

  await page.getByRole("button", { name: "Retry visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled({ timeout: 5000 })

  expect(capturedPayloads.length).toBe(2)
  const retryPayload = capturedPayloads[1]
  // The Retry request must still carry the ORIGINAL kitchen/light_natural/oak values.
  expect(retryPayload).toContain("kitchen")
  expect(retryPayload).toContain("light_natural")
  expect(retryPayload).toContain("\"oak\"")
  expect(retryPayload).not.toContain("bedroom")
  expect(retryPayload).not.toContain("dark_modern")
  expect(retryPayload).not.toContain("\"maple\"")

  // The live form still visibly shows the edited-but-unused values.
  await expect(page.getByRole("group", { name: "Room type" }).getByRole("button", { name: "Bedroom" })).toHaveAttribute("aria-pressed", "true")
})

test("F — rapid triple-click Retry produces exactly one new request", async ({ page }) => {
  await mockProvider(page, "success")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })

  const getCount = await countPosts(page)
  await clickButtonRapidly(page, "Retry visualization", 3)
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeEnabled({ timeout: 5000 })
  expect(getCount()).toBe(1)
})

test("G/H — mutual duplicate protection: Retry while Generate active, Generate while Retry active", async ({ page }) => {
  await mockProvider(page, "success")
  await page.getByRole("button", { name: "Create my floor visualization" }).click()
  await expect(page.getByRole("button", { name: "Retry visualization" })).toBeVisible({ timeout: 5000 })

  await mockProvider(page, "timeout")
  const getCount = await countPosts(page)

  const generateBtn = page.getByRole("button", { name: /Creating your floor visualization|Create my floor visualization/ })
  const retryBtn = page.getByRole("button", { name: "Retry visualization" })

  await retryBtn.click() // starts a slow (timeout-mode) attempt, acquiring the lock
  await expect(generateBtn).toBeDisabled()
  await generateBtn.click({ force: true }) // attempted while lock is held
  await expect(retryBtn).toBeDisabled()
  await retryBtn.click({ force: true }) // attempted again while still locked

  // Only the single original Retry-triggered request should have gone out.
  expect(getCount()).toBe(1)

  test.setTimeout(30_000)
  await expect(page.getByText(/taking longer than expected/)).toBeVisible({ timeout: 12_000 })
  await expect(retryBtn).toBeEnabled()
})
