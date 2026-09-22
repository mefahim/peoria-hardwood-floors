// Phase 1 — Upload & Image Handling (visualizer-docs/01-PHASE-UPLOAD.md)
// Single source of truth for upload constraints, validation, and the normalized image shape.

export const UPLOAD_CONSTRAINTS = {
  maxFileSizeMB: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  minWidth: 640,
  minHeight: 480,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const

export type UploadStatus = "idle" | "validating" | "ready" | "validation_error"

export type UploadErrorCode = "UNSUPPORTED_FILE_TYPE" | "FILE_TOO_LARGE" | "IMAGE_TOO_SMALL" | "IMAGE_UNREADABLE"

export interface UploadError {
  code: UploadErrorCode
  message: string
}

// The normalized image object handed off to later phases. `source` is retained
// so a future phase can actually transmit the file to a generation backend.
export interface NormalizedImage {
  source: File
  previewUrl: string
  fileName: string
  mimeType: string
  size: number
  width: number
  height: number
}

export type ImageValidationResult = { ok: true; image: NormalizedImage } | { ok: false; error: UploadError }

const ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  UNSUPPORTED_FILE_TYPE: "This file type isn't supported. Please upload a JPG, PNG, or WebP image.",
  FILE_TOO_LARGE: `This image is too large. Please choose an image under ${UPLOAD_CONSTRAINTS.maxFileSizeMB} MB.`,
  IMAGE_TOO_SMALL: "This image is too small for a reliable preview. Please choose a higher-resolution room photo.",
  IMAGE_UNREADABLE: "We couldn't read this image. Please choose another photo.",
}

function isAcceptedMimeType(mimeType: string): boolean {
  return (UPLOAD_CONSTRAINTS.acceptedMimeTypes as readonly string[]).includes(mimeType)
}

function decodeImageDimensions(objectUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"))
    img.src = objectUrl
  })
}

// Runs the full Phase 1 validation pipeline: type -> size -> decode -> dimensions.
// The caller owns the returned `previewUrl` and is responsible for revoking it.
export async function validateAndNormalizeImageFile(file: File): Promise<ImageValidationResult> {
  if (!isAcceptedMimeType(file.type)) {
    return { ok: false, error: { code: "UNSUPPORTED_FILE_TYPE", message: ERROR_MESSAGES.UNSUPPORTED_FILE_TYPE } }
  }

  if (file.size > UPLOAD_CONSTRAINTS.maxFileSizeBytes) {
    return { ok: false, error: { code: "FILE_TOO_LARGE", message: ERROR_MESSAGES.FILE_TOO_LARGE } }
  }

  const objectUrl = URL.createObjectURL(file)

  let dimensions: { width: number; height: number }
  try {
    dimensions = await decodeImageDimensions(objectUrl)
  } catch {
    URL.revokeObjectURL(objectUrl)
    return { ok: false, error: { code: "IMAGE_UNREADABLE", message: ERROR_MESSAGES.IMAGE_UNREADABLE } }
  }

  if (dimensions.width < UPLOAD_CONSTRAINTS.minWidth || dimensions.height < UPLOAD_CONSTRAINTS.minHeight) {
    URL.revokeObjectURL(objectUrl)
    return { ok: false, error: { code: "IMAGE_TOO_SMALL", message: ERROR_MESSAGES.IMAGE_TOO_SMALL } }
  }

  return {
    ok: true,
    image: {
      source: file,
      previewUrl: objectUrl,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    },
  }
}
