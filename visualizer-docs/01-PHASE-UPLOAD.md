# 01-PHASE-UPLOAD.md

# Phase 1 — Upload & Image Handling

## 1. Phase Purpose

Phase 1 establishes a reliable image-upload foundation for the Visualizer.

The goal is to allow a user to select a room photograph, validate it safely, preview it, replace it when needed, and recover cleanly from invalid or failed uploads.

This phase does **not** generate an AI visualization.

The phase ends when the application has a valid, usable source image stored in the defined frontend state and is ready for the Options phase.

---

# 2. Scope

## In Scope

- File selection
- Supported image formats
- Client-side validation
- Image preview
- Image replacement
- File-selection cancellation
- Invalid-file handling
- Basic image readability checks
- Upload state management
- Upload-related error handling
- Preparing normalized image data for the next phase
- Mobile-compatible file selection
- Basic accessibility for the upload control

## Out of Scope

Do not implement:

- AI generation
- AI API integration
- Prompt generation
- Result generation
- Retry generation
- Save/share
- Authentication
- CRM
- Estimate calculation
- Permanent user image library
- Advanced computer-vision floor detection
- Image editing/cropping UI unless explicitly required later

---

# 3. User Goal

The user should be able to:

1. Open the Visualizer.
2. Select a room image.
3. Immediately see whether the image is accepted.
4. See a preview of the selected image.
5. Replace the image if desired.
6. Continue to the next stage only when a valid image exists.

The user should never be forced to restart the entire Visualizer because of an upload mistake.

---

# 4. Supported File Types

The initial supported formats are:

- JPEG
- JPG
- PNG
- WebP

The implementation must validate the actual file type rather than trusting the filename extension alone.

## Unsupported Formats

Examples:

- GIF
- SVG
- PDF
- TIFF
- HEIC/HEIF unless explicitly enabled later
- Video files
- Non-image files

If an unsupported file is selected:

- Reject it.
- Do not replace an existing valid image.
- Show a clear user-facing error.
- Allow the user to select another file.

---

# 5. File Size

A maximum file size must be enforced.

The exact production limit should be configured centrally rather than hardcoded throughout the UI.

Recommended initial configuration:

```text
MAX_FILE_SIZE_MB = 10
```

This value is a configurable implementation default, not a permanent product requirement.

If the selected file exceeds the configured limit:

```text
Reject
→ preserve existing valid image
→ show error
→ allow replacement
```

Suggested message:

> This image is too large. Please choose an image under 10 MB.

The message must use the actual configured limit if that limit changes.

---

# 6. Image Dimensions

The implementation should reject images that are clearly too small to produce a useful visualization.

Recommended initial minimum:

```text
MIN_WIDTH = 640
MIN_HEIGHT = 480
```

These values are configurable and should not be duplicated across components.

If the image is below the minimum:

> This image is too small for a reliable preview. Please choose a higher-resolution room photo.

Do not silently upscale a very small source image during this phase.

---

# 7. Image Readability

A selected file must be verified as an image that the browser can actually decode.

Validation flow:

```text
File selected
    ↓
Check file type
    ↓
Check file size
    ↓
Attempt image decode
    ↓
Check dimensions
    ↓
Valid
```

If decoding fails:

> We couldn't read this image. Please choose another photo.

Do not mark the file as valid based only on MIME type or extension.

---

# 8. Upload State Model

The upload feature should use explicit states.

```text
IDLE
  ↓
SELECTING
  ↓
VALIDATING
  ↓
READY
```

Failure states:

```text
VALIDATION_ERROR
UPLOAD_ERROR
```

If the implementation does not perform a server upload in V1, `UPLOAD_ERROR` may only be required when an actual upload operation exists.

The state model must not create unnecessary intermediate states.

---

# 9. State Definition

The Visualizer should maintain a normalized upload state.

Conceptually:

```js
{
  status: "idle",
  file: null,
  previewUrl: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  width: null,
  height: null,
  error: null
}
```

Exact implementation may differ according to the existing project architecture.

The following principles must remain:

- One authoritative current image.
- One authoritative upload status.
- One authoritative upload error.
- No duplicated image state across unrelated components.

---

# 10. Selecting a File

When the user selects a file:

```text
SELECTING
    ↓
VALIDATING
```

The application validates the file before considering it the current image.

A valid selection becomes:

```text
READY
```

An invalid selection becomes:

```text
VALIDATION_ERROR
```

---

# 11. Existing Valid Image Must Be Preserved on Failed Replacement

This is a critical requirement.

Example:

```text
Current image = valid.jpg
User selects = invalid.pdf
```

Expected:

```text
Current image remains valid.jpg
Error is shown
User can try again
```

Do NOT:

```text
invalid selection
→ clear existing image
```

unless the user explicitly chooses a remove/start-over action.

This prevents accidental loss of valid user input.

---

# 12. Replacing an Image

The user must be able to replace an existing image.

Flow:

```text
READY
 ↓
Change Photo
 ↓
Select new file
 ↓
Validate
 ↓
READY
```

If the new image is invalid:

```text
READY
 ↓
Change Photo
 ↓
Invalid file
 ↓
VALIDATION_ERROR
```

The previous valid image remains available.

---

# 13. Cancelling File Selection

If the user opens the file picker and cancels without selecting a file:

### If no image exists

Remain:

```text
IDLE
```

### If an image already exists

Remain:

```text
READY
```

Do not show an error.

Cancelling a file picker is normal user behavior, not an error.

---

# 14. Preview Requirements

After successful validation, display a preview of the selected room image.

The preview must:

- Represent the selected file accurately.
- Not require AI processing.
- Update when the user replaces the image.
- Not display a stale previous image.
- Handle loading/decode failure gracefully.

The preview URL/object reference must be cleaned up appropriately when replaced or no longer needed, depending on the implementation method.

---

# 15. Image Orientation

Mobile photos may contain orientation metadata.

The implementation must verify that images do not appear incorrectly rotated because of orientation handling.

Examples to test:

- Portrait phone photo
- Landscape phone photo
- Images with EXIF orientation metadata

If browser decoding naturally handles the orientation, no additional transformation is required.

Do not introduce unnecessary image transformation solely for this requirement.

---

# 16. Mobile Camera/File Behavior

The upload feature must work on mobile browsers.

Test:

- Android file picker
- Mobile camera capture if exposed by the browser
- Portrait photos
- Large phone photos
- Slow network/device conditions
- Replacing a selected photo

Do not make drag-and-drop the only upload method.

A normal file-picker control must always remain available.

---

# 17. Drag & Drop

If drag-and-drop is present:

- Dropping a valid file must trigger the same validation pipeline as file selection.
- Dropping an invalid file must produce the same validation behavior.
- Drag-and-drop must not create a separate validation system.
- The same upload state must be used.

Conceptually:

```text
File Picker ─────┐
                 ├──> normalizeFileInput()
Drag & Drop ─────┘
                         ↓
                      Validate
```

---

# 18. Multiple File Selection

The Visualizer requires one source room image.

Therefore:

- Only one active source image is allowed.
- Multiple-file selection should be disabled where possible.
- If multiple files are somehow supplied, the behavior must be deterministic.

Preferred behavior:

> Accept only the first selected file and clearly maintain one active image.

Do not silently create multiple visualizer sessions.

---

# 19. File Input Reset

After replacing/removing a file, the file input must be capable of selecting the same physical file again.

Example:

```text
photo.jpg selected
↓
photo.jpg removed/rejected
↓
user selects photo.jpg again
```

The implementation must not prevent the second selection merely because the browser input value has not changed.

Reset the native input value when appropriate.

---

# 20. Security Rules

Treat every uploaded file as untrusted.

At minimum:

- Validate MIME type.
- Validate file extension.
- Validate actual image readability.
- Enforce file size.
- Do not execute uploaded content.
- Do not render uploaded SVG as trusted markup.
- Do not trust filename values.
- Avoid injecting filename content directly into HTML.

If server-side upload/storage is introduced later, the same validations must also occur server-side.

Client-side validation is not a security boundary.

---

# 21. Filename Handling

The original filename may be displayed to the user if useful.

However:

- Never use it as an identifier.
- Never assume it is safe for filesystem paths.
- Escape it before rendering.
- Do not depend on its extension for security decisions.

Example:

```text
../../malicious-file
```

must never become a server filesystem path.

---

# 22. Error Messages

Errors should be human-readable and actionable.

Use specific messages.

### Unsupported format

> This file type isn't supported. Please upload a JPG, PNG, or WebP image.

### File too large

> This image is too large. Please choose a smaller image.

### Image too small

> This image is too small. Please choose a higher-resolution room photo.

### Corrupt/unreadable

> We couldn't read this image. Please choose another photo.

Avoid exposing raw technical errors such as:

```text
DOMException
ERR_FILE_TYPE
TypeError
```

These may be logged for developers but should not be the primary user-facing message.

---

# 23. Error Recovery

Every expected upload error must have a recovery path.

Example:

```text
Invalid image
     ↓
Error message
     ↓
Choose another photo
```

The user should not need to refresh the page.

If an existing valid image exists, it must remain usable after an invalid replacement attempt.

---

# 24. Loading Behavior

Local image validation should normally feel immediate.

If an asynchronous operation is used for:

- image decoding
- compression
- preprocessing

then an explicit processing state should be used.

Do not show a long-running spinner for operations that complete synchronously.

---

# 25. Image Preprocessing

No permanent image transformation is required in this phase unless needed by the existing implementation.

If preprocessing is introduced, it must:

- Preserve visual quality.
- Preserve aspect ratio.
- Avoid unnecessary compression.
- Not unexpectedly alter the user's preview.
- Be isolated from the original selected file.

The original source should remain conceptually distinct from any derived AI-ready image.

---

# 26. Normalized Image Object

Before leaving Phase 1, the system should have a normalized representation similar to:

```js
{
  source: File,
  previewUrl: string,
  fileName: string,
  mimeType: string,
  size: number,
  width: number,
  height: number
}
```

The exact object may differ.

The important requirement is that Phase 2 should not need to re-read or rediscover basic image information.

---

# 27. Boundary With Phase 2

Phase 1 is complete when it provides:

```text
VALID IMAGE
+
NORMALIZED IMAGE STATE
```

Phase 2 should be able to consume that state without knowing how the file was selected.

Phase 2 should not need to know whether the image came from:

- File picker
- Drag & drop
- Mobile camera

All input methods must converge into the same normalized state.

---

# 28. Accessibility

The upload control must be usable without a mouse.

Requirements:

- Proper accessible label.
- Keyboard access.
- Visible focus state.
- Clear error association.
- Button/control names that describe the action.
- Do not rely only on color to indicate validity/error.
- Screen-reader users must be able to understand whether an image is ready.

Example accessible action:

> Upload a room photo

Better than an unlabeled icon-only control.

---

# 29. Browser Compatibility

The implementation should use broadly supported browser APIs unless the existing project requires otherwise.

At minimum test:

- Chrome desktop
- Chrome Android
- Safari/iOS if available
- One additional major desktop browser

Do not introduce a browser-specific solution without justification.

---

# 30. Performance Expectations

The upload feature should not unnecessarily duplicate large image data.

Avoid:

- Multiple copies of the same image in memory.
- Unnecessary base64 conversion.
- Repeated image decoding.
- Repeated compression.
- Loading the same preview multiple times.

If the image only needs a local preview, prefer an appropriate browser object URL or equivalent rather than converting large files to base64 without a reason.

---

# 31. Test Matrix

## Valid Files

- JPG
- JPEG
- PNG
- WebP
- Small valid room photo
- Large valid room photo within configured limit
- Portrait image
- Landscape image

## Invalid Files

- PDF
- GIF
- SVG
- TXT
- Oversized image
- Corrupt image
- Too-small image

## User Actions

- Select image
- Cancel selection
- Replace image
- Select same image again
- Select invalid replacement
- Replace invalid replacement with valid image
- Use keyboard
- Use mobile device
- Drag and drop if supported

---

# 32. Acceptance Criteria

Phase 1 is considered complete only when all applicable criteria pass.

### UPL-001 — Select Image

A user can select a supported room image.

### UPL-002 — Format Validation

Unsupported file types are rejected.

### UPL-003 — Size Validation

Files exceeding the configured limit are rejected.

### UPL-004 — Image Decode Validation

Unreadable/corrupt images are rejected.

### UPL-005 — Dimension Validation

Images below the configured minimum dimensions are rejected.

### UPL-006 — Preview

A valid image produces an accurate local preview.

### UPL-007 — Replace Image

A valid image can be replaced by another valid image.

### UPL-008 — Preserve Valid State

An invalid replacement does not destroy the existing valid image.

### UPL-009 — Cancel

Cancelling file selection does not create an error or destroy existing valid state.

### UPL-010 — Same File

A user can select the same file again after replacement/removal/rejection when appropriate.

### UPL-011 — Mobile

The upload flow works on supported mobile browsers.

### UPL-012 — Accessibility

The upload control is keyboard and screen-reader accessible to a reasonable production standard.

### UPL-013 — Error Recovery

Every expected upload error provides a clear recovery path.

### UPL-014 — Single Source Image

Only one active source image exists in the Visualizer state.

### UPL-015 — Normalized State

A valid image is exposed to the next phase through a consistent normalized state.

---

# 33. Definition of Done

Phase 1 cannot be marked complete until:

- [ ] Supported formats work.
- [ ] Invalid formats are rejected.
- [ ] File size validation works.
- [ ] Dimension validation works.
- [ ] Corrupt/unreadable images are handled.
- [ ] Preview works.
- [ ] Replace image works.
- [ ] Invalid replacement preserves valid state.
- [ ] File picker cancellation behaves correctly.
- [ ] Same-file reselection works.
- [ ] Mobile behavior has been tested.
- [ ] Keyboard accessibility has been tested.
- [ ] Expected errors are user-friendly.
- [ ] No critical console/runtime errors exist.
- [ ] No duplicate image state exists.
- [ ] Relevant acceptance criteria pass.
- [ ] No out-of-scope features were introduced.

---

# 34. Agent Implementation Rules

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read this phase document.
4. Inspect the existing Visualizer implementation before changing it.
5. Reuse the existing project architecture where appropriate.
6. Avoid unrelated refactoring.
7. Implement only Phase 1.
8. Use a single validation pipeline for all file-input methods.
9. Preserve valid state after failed replacement.
10. Test both success and failure paths.
11. Report any ambiguity before making a product-level decision.
12. Do not proceed to Phase 2 until Phase 1 acceptance criteria are satisfied.

---

# 35. Phase Output

At the end of Phase 1, the implementation must expose a reliable result equivalent to:

```text
Upload Phase
    ↓
READY
    ↓
Normalized valid image
    ↓
Ready for Options Phase
```

No AI generation should occur in Phase 1.

No real AI API is required for this phase.
