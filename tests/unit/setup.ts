// Phase 8 — Testing (visualizer-docs/08-PHASE-TESTING.md §9 Test Data Principles)
// jsdom does not implement real image decoding or object URLs. These stubs are
// deliberately minimal and deterministic — they never fabricate a *decoded*
// image's dimensions (that stays controlled per-test via `queueNextImage` in
// tests/unit/upload.test.ts); they only make the browser APIs the production
// code under test calls (`URL.createObjectURL`, `URL.revokeObjectURL`, `Image`)
// exist and behave predictably in the jsdom environment.

import { vi } from "vitest"

let objectUrlCounter = 0

if (!("createObjectURL" in URL)) {
  Object.defineProperty(URL, "createObjectURL", { writable: true, value: () => "" })
}
if (!("revokeObjectURL" in URL)) {
  Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: () => {} })
}

vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:http://localhost/${++objectUrlCounter}`)
vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
