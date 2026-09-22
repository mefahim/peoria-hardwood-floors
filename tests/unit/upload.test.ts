// Phase 8 — Testing: Upload (visualizer-docs/08-PHASE-TESTING.md §12, UP-T-001..013)
// Tests the real, unmodified lib/visualizer/image-upload.ts — the single source
// of truth for upload constraints (01-PHASE-UPLOAD.md). jsdom cannot actually
// decode image bytes, so `Image` is replaced with a deterministic, per-test
// controllable stub (see queueNextImageOutcome) — every OTHER code path
// (MIME check, size check, object-URL lifecycle) runs completely for real.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { UPLOAD_CONSTRAINTS, validateAndNormalizeImageFile } from "@/lib/visualizer/image-upload"

type QueuedOutcome = { width: number; height: number } | "error"

let queue: QueuedOutcome[] = []

function queueNextImageOutcome(outcome: QueuedOutcome) {
  queue.push(outcome)
}

class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 0
  naturalHeight = 0
  private _src = ""
  set src(value: string) {
    this._src = value
    const outcome = queue.shift()
    queueMicrotask(() => {
      if (!outcome || outcome === "error") {
        this.onerror?.()
      } else {
        this.naturalWidth = outcome.width
        this.naturalHeight = outcome.height
        this.onload?.()
      }
    })
  }
  get src() {
    return this._src
  }
}

beforeEach(() => {
  queue = []
  vi.stubGlobal("Image", FakeImage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe("validateAndNormalizeImageFile", () => {
  // UP-T-001/002/003 — every accepted MIME type is actually accepted.
  it.each([
    ["image/jpeg", "room.jpg"],
    ["image/png", "room.png"],
    ["image/webp", "room.webp"],
  ])("accepts a valid %s file", async (type, name) => {
    queueNextImageOutcome({ width: 1200, height: 900 })
    const file = makeFile(name, type, 5000)
    const result = await validateAndNormalizeImageFile(file)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.image.fileName).toBe(name)
      expect(result.image.mimeType).toBe(type)
      expect(result.image.width).toBe(1200)
      expect(result.image.height).toBe(900)
      expect(result.image.previewUrl).toMatch(/^blob:/)
      expect(result.image.source).toBe(file)
    }
  })

  // UP-T-004
  it("rejects an unsupported file type", async () => {
    const file = makeFile("room.gif", "image/gif", 5000)
    const result = await validateAndNormalizeImageFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe("UNSUPPORTED_FILE_TYPE")
  })

  // UP-T-005
  it("rejects a file over the size limit", async () => {
    const file = makeFile("room.jpg", "image/jpeg", UPLOAD_CONSTRAINTS.maxFileSizeBytes + 1)
    const result = await validateAndNormalizeImageFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe("FILE_TOO_LARGE")
  })

  it("accepts a file exactly at the size limit", async () => {
    queueNextImageOutcome({ width: 1200, height: 900 })
    const file = makeFile("room.jpg", "image/jpeg", UPLOAD_CONSTRAINTS.maxFileSizeBytes)
    const result = await validateAndNormalizeImageFile(file)
    expect(result.ok).toBe(true)
  })

  // UP-T-006
  it("rejects an image below the minimum dimensions", async () => {
    queueNextImageOutcome({ width: 100, height: 100 })
    const file = makeFile("room.jpg", "image/jpeg", 5000)
    const result = await validateAndNormalizeImageFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe("IMAGE_TOO_SMALL")
  })

  it("rejects when only width is below minimum", async () => {
    queueNextImageOutcome({ width: UPLOAD_CONSTRAINTS.minWidth - 1, height: 1000 })
    const result = await validateAndNormalizeImageFile(makeFile("room.jpg", "image/jpeg", 5000))
    expect(result.ok).toBe(false)
  })

  it("rejects when only height is below minimum", async () => {
    queueNextImageOutcome({ width: 1000, height: UPLOAD_CONSTRAINTS.minHeight - 1 })
    const result = await validateAndNormalizeImageFile(makeFile("room.jpg", "image/jpeg", 5000))
    expect(result.ok).toBe(false)
  })

  it("accepts an image exactly at the minimum dimensions", async () => {
    queueNextImageOutcome({ width: UPLOAD_CONSTRAINTS.minWidth, height: UPLOAD_CONSTRAINTS.minHeight })
    const result = await validateAndNormalizeImageFile(makeFile("room.jpg", "image/jpeg", 5000))
    expect(result.ok).toBe(true)
  })

  // UP-T-007
  it("rejects a corrupt/unreadable image", async () => {
    queueNextImageOutcome("error")
    const file = makeFile("room.jpg", "image/jpeg", 5000)
    const result = await validateAndNormalizeImageFile(file)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe("IMAGE_UNREADABLE")
  })

  // UP-T-011 — normalized metadata mirrors the source file exactly.
  it("normalizes image metadata from the source file", async () => {
    queueNextImageOutcome({ width: 1600, height: 1200 })
    const file = makeFile("kitchen-photo.png", "image/png", 42_000)
    const result = await validateAndNormalizeImageFile(file)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.image.size).toBe(42_000)
      expect(result.image.fileName).toBe("kitchen-photo.png")
    }
  })

  // UP-T-012/013 — orientation-agnostic: portrait and landscape both accepted
  // once they individually clear the minimum-dimension gate.
  it("accepts a portrait image", async () => {
    queueNextImageOutcome({ width: 900, height: 1600 })
    const result = await validateAndNormalizeImageFile(makeFile("portrait.jpg", "image/jpeg", 5000))
    expect(result.ok).toBe(true)
  })

  it("accepts a landscape image", async () => {
    queueNextImageOutcome({ width: 1600, height: 900 })
    const result = await validateAndNormalizeImageFile(makeFile("landscape.jpg", "image/jpeg", 5000))
    expect(result.ok).toBe(true)
  })

  // Object URL lifecycle: an object URL created for the decode attempt must be
  // revoked when that attempt is ultimately rejected (04/05-PHASE docs §
  // memory management) — the caller never gets a dangling URL for a file that
  // was never actually accepted.
  it("revokes the object URL when the decoded image is too small", async () => {
    queueNextImageOutcome({ width: 10, height: 10 })
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL")
    revokeSpy.mockClear()
    await validateAndNormalizeImageFile(makeFile("room.jpg", "image/jpeg", 5000))
    expect(revokeSpy).toHaveBeenCalledTimes(1)
  })

  it("revokes the object URL when the image is unreadable", async () => {
    queueNextImageOutcome("error")
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL")
    revokeSpy.mockClear()
    await validateAndNormalizeImageFile(makeFile("room.jpg", "image/jpeg", 5000))
    expect(revokeSpy).toHaveBeenCalledTimes(1)
  })

  it("does NOT revoke the object URL for an accepted image (caller owns it)", async () => {
    queueNextImageOutcome({ width: 1200, height: 900 })
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL")
    revokeSpy.mockClear()
    await validateAndNormalizeImageFile(makeFile("room.jpg", "image/jpeg", 5000))
    expect(revokeSpy).not.toHaveBeenCalled()
  })

  // UP-T-010 — validating "the same file" twice behaves identically both times
  // (no hidden internal memoization/one-shot state).
  it("can validate the exact same File object twice with identical results", async () => {
    const file = makeFile("room.jpg", "image/jpeg", 5000)
    queueNextImageOutcome({ width: 1200, height: 900 })
    const first = await validateAndNormalizeImageFile(file)
    queueNextImageOutcome({ width: 1200, height: 900 })
    const second = await validateAndNormalizeImageFile(file)
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
  })
})
