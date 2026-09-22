// Phase 8 — Testing (visualizer-docs/08-PHASE-TESTING.md)
// Unit-test configuration for pure/deterministic visualizer logic. Playwright
// owns real-browser E2E (see playwright.config.ts) — this file is scoped to
// tests/unit only so `pnpm test:unit` never accidentally picks up .spec.ts
// Playwright specs (and vice versa).

import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["tests/unit/setup.ts"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["lib/visualizer/**/*.ts"],
      exclude: ["lib/visualizer/providers/types.ts"],
      reporter: ["text", "text-summary"],
    },
  },
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
})
