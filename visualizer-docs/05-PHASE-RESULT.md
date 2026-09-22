# 05 — PHASE: RESULT

## 1. Phase Purpose

This phase defines the **Result workflow** for the Peoria Hardwood Floors Visualizer.

The purpose is to reliably take a successful generation response from Phase 4 and turn it into a stable, user-visible visualization result.

The core flow is:

```text
GENERATION SUCCESS
        ↓
VALIDATE RESULT
        ↓
STORE RESULT STATE
        ↓
DISPLAY RESULT
        ↓
USER CAN REVIEW
        ↓
READY FOR FUTURE RETRY PHASE
```

This phase is focused on **functional result handling**, not visual redesign.

The Result phase must never claim that a visualization exists unless a valid generation result has actually been received and accepted.

---

# 2. Scope

## 2.1 In Scope

This phase covers:

- Receiving the normalized success result from Phase 4.
- Result-state management.
- Result response validation.
- Displaying the generated visualization.
- Loading-to-result transition.
- Result image loading/error handling.
- Source/request association.
- Preventing stale results.
- Result metadata needed for future phases.
- Returning from result state to the visualizer flow where appropriate.
- Handling result replacement by a newer generation.
- Empty/malformed result protection.
- Accessibility.
- Mobile functional behavior.
- Result lifecycle testing.
- Preparing result state for the future Retry phase.

## 2.2 Out of Scope

Do NOT implement in this phase:

- Retry functionality beyond preparing the state boundary.
- Save.
- Share.
- Download.
- CRM.
- Estimate generation.
- Analytics.
- Authentication.
- Payment.
- Chat refinement.
- Real AI provider integration.
- Prompt engineering.
- AI masking/segmentation.
- Before/after slider unless already explicitly required by the existing product specification.
- New visualizer options.
- Major visual redesign.

---

# 3. Dependencies

This phase depends on:

```text
00-MASTER-SPEC.md
01-PHASE-UPLOAD.md
02-PHASE-OPTIONS.md
03-PHASE-VALIDATION.md
04-PHASE-GENERATE.md
AGENT-INSTRUCTIONS.md
```

The expected upstream flow is:

```text
Upload
  ↓
Options
  ↓
Validation
  ↓
Generate
  ↓
Result
```

---

# 4. Core Principle

A result is not considered successful merely because:

- generation finished
- an HTTP request returned
- the provider returned status 200
- the UI received a response object

The result must contain enough valid information to display the generated visualization.

Therefore:

```text
Provider Success
      ↓
Result Validation
      ↓
Valid Result?
 ├─ No → Result Error
 └─ Yes
      ↓
SUCCESS RESULT STATE
```

---

# 5. Result State Machine

Recommended state model:

```text
IDLE
  ↓
GENERATING
  ↓
RESULT_VALIDATING
  ↓
RESULT_READY
```

Failure paths:

```text
GENERATING
  ↓
GENERATION_ERROR

GENERATING
  ↓
GENERATION_TIMEOUT

RESULT_VALIDATING
  ↓
RESULT_ERROR
```

The exact internal state names may follow the existing application architecture.

The important requirement is that the application must distinguish:

```text
No result
Result loading
Valid result
Invalid result
Result display failure
```

---

# 6. Result State Contract

Recommended conceptual structure:

```js
{
  status: "idle",

  requestId: null,

  result: null,

  sourceSnapshot: null,

  optionsSnapshot: null,

  error: null
}
```

On success:

```js
{
  status: "ready",

  requestId: "viz_123",

  result: {
    imageUrl: "/generated/result.jpg"
  },

  sourceSnapshot: {...},

  optionsSnapshot: {...},

  error: null
}
```

The exact state structure may differ if the existing application already has a suitable state model.

Do not refactor the entire application merely to match this example.

---

# 7. Result Input Contract

The Result phase should receive the normalized Phase 4 result.

Recommended success contract:

```js
{
  requestId: string,
  status: "success",

  result: {
    imageUrl: string
  }
}
```

The implementation may support additional metadata.

Minimum required information:

```text
requestId
status
result.imageUrl
```

---

# 8. Result Validation

Before displaying a generated image, validate the provider result.

Required checks:

1. Response exists.
2. Status indicates success.
3. Request ID exists.
4. Request ID matches the active generation attempt.
5. Result object exists.
6. Image URL/reference exists.
7. Image URL/reference is usable by the application.

If any required condition fails:

```text
RESULT_ERROR
```

Do not display a blank result area and call it success.

---

# 9. Request ID Matching

The result must belong to the active generation request.

Example:

```text
Active request:
viz_A
```

Provider returns:

```text
requestId:
viz_B
```

The result must not be accepted as the active result.

Expected behavior:

```text
Reject stale/mismatched result
```

Recommended internal error code:

```text
RESULT_REQUEST_MISMATCH
```

---

# 10. Stale Result Protection

A critical scenario:

```text
Generation A
    ↓
slow response

User starts Generation B
    ↓
Generation B becomes active

Generation B completes
    ↓
Result B displayed

Generation A completes later
```

Result A must NOT overwrite Result B.

The active request ID/attempt identity must be checked before committing the result.

---

# 11. Result Image Validation

The result image must be considered invalid if:

- image URL/reference is missing
- image URL/reference is empty
- the image cannot be loaded
- the provider returned an unsupported result format
- the reference is malformed according to the application's accepted contract

Recommended error code:

```text
RESULT_IMAGE_INVALID
```

Do not assume that a string is automatically a valid image.

---

# 12. Image Loading Lifecycle

The result image has its own browser loading lifecycle.

Conceptually:

```text
RESULT_READY
    ↓
IMAGE_LOADING
    ↓
IMAGE_LOADED
```

or:

```text
IMAGE_LOADING
    ↓
IMAGE_LOAD_ERROR
```

The generation request may have succeeded while the browser fails to load the resulting image.

These are separate failure conditions.

---

# 13. Generation Success vs Image Load Failure

Example:

```text
Provider:
SUCCESS
```

but:

```text
Browser:
image failed to load
```

The application must not pretend the image is visible.

Expected behavior:

```text
Result exists
+
Image display failed
=
Result display error
```

The underlying generation result should remain identifiable for debugging/future recovery where appropriate.

---

# 14. Result Display

The result screen/component should display the generated visualization prominently.

Functional requirements:

- image is visible when successfully loaded.
- image maintains its correct aspect ratio.
- image is not unintentionally cropped.
- image is not stretched.
- image remains usable on mobile.
- loading state is visible while the image is loading.
- image errors have a clear fallback.

Do not introduce major visual design changes in this phase.

---

# 15. Image Aspect Ratio

The generated image should be displayed without distortion.

Do not force a fixed width/height combination that stretches the image.

Preferred conceptual behavior:

```text
natural aspect ratio
+
responsive container
```

The exact CSS implementation should follow the existing project.

---

# 16. Result Loading State

When the result image itself is loading, show an explicit loading state.

Example:

```text
Preparing your visualization…
```

Do not show an empty white/blank area without context.

If the generation provider already returned a final image URL, this is an image-loading state rather than another AI-generation state.

Keep the distinction clear.

---

# 17. No Fake Result

Never use a static placeholder as if it were the real generated result in production.

Mock assets may be used during development when the Mock Provider is active, but they must be clearly treated as mock results.

The application must not tell the user:

```text
Your personalized floor visualization is ready
```

unless a valid result actually exists.

---

# 18. Source Image Association

The successful result should remain associated with the source image used for that generation attempt.

Conceptually:

```text
Source Image A
     +
Options Snapshot A
     ↓
Generation Request A
     ↓
Result A
```

This association becomes important for future Retry behavior.

Do not replace the source snapshot with a newly selected image after generation has already completed.

---

# 19. Options Snapshot

The result should retain the validated options used to create it.

Example:

```js
optionsSnapshot: {
  roomType: "living_room",
  projectType: "new_installation",
  preferredStyle: "light_natural",
  customStyleDescription: "",
  woodSpecies: "oak",
  floorDirection: "parallel",
  finishPreference: "bona_traffic_hd",
  sheen: "satin",
  serviceCity: null,
  squareFootage: 1200
}
```

This is not for display necessarily.

It is primarily for reliable state continuity and future Retry implementation.

---

# 20. Immutable Generation Snapshot

The result must correspond to the exact request snapshot that generated it.

Once generation begins:

```text
Request Snapshot
```

must be treated as immutable for that attempt.

Later user changes must not rewrite the historical request associated with the result.

---

# 21. Result Replacement

If a later generation succeeds:

```text
Result A
   ↓
Generation B
   ↓
Result B
```

Result B becomes the active result.

Result A must not reappear because of delayed async callbacks.

The state should have one clearly identified active result.

---

# 22. Result Error Handling

If the result cannot be displayed, show a clear user-facing error.

Example:

```text
We generated the visualization, but it couldn't be displayed. Please try again.
```

Do not expose technical details such as:

```text
TypeError: Cannot read properties of undefined
```

or:

```text
HTTP 502
```

to normal users.

Technical details may remain in development logs where appropriate.

---

# 23. Error State Preservation

When a result error occurs:

- preserve the source image.
- preserve the selected options.
- preserve the request ID.
- preserve useful error information internally.
- allow a future recovery/retry action.

Do not reset the entire visualizer.

---

# 24. Result Error vs Generation Error

Keep these conceptually separate.

### Generation Error

The provider failed to produce a result.

```text
GENERATING
→ ERROR
```

### Result Error

The provider returned success, but the application could not validate or display the result.

```text
GENERATION SUCCESS
→ RESULT VALIDATION/DISPLAY ERROR
```

This distinction will make debugging and future retry behavior more reliable.

---

# 25. Result State Reset

Resetting the result should be explicit.

Example:

```text
New generation begins
```

may clear the currently active result or mark it as inactive.

Do not accidentally clear:

- source image
- option selections

unless the user intentionally starts a new visualizer session.

---

# 26. New Generation From Result

If the existing UI allows the user to return to configuration and generate again, the transition should be explicit.

Conceptually:

```text
RESULT_READY
      ↓
EDIT / NEW GENERATION
      ↓
VALIDATION
      ↓
GENERATING
```

The previous result must not be accidentally submitted as the new source image unless that behavior is explicitly defined.

The original source image remains the source for generation unless the user intentionally replaces it.

---

# 27. Result and Retry Boundary

Retry is a separate phase.

Phase 5 must only prepare the required state boundary.

The future Retry phase may use:

```js
sourceSnapshot
optionsSnapshot
requestId
```

to recreate a valid generation attempt.

Do not implement multiple retry strategies here.

---

# 28. Browser Image Errors

Handle common browser image failure scenarios:

- 404 result URL
- inaccessible result URL
- unsupported format
- network interruption
- revoked/expired temporary URL
- blocked resource where applicable

The user-facing outcome should be:

```text
Result could not be displayed.
```

with an available recovery path later.

---

# 29. Temporary Result URLs

If a provider returns temporary image URLs, the architecture must treat them as potentially expiring.

Do not assume:

```text
imageUrl
```

is permanently accessible.

Do not implement permanent storage in this phase unless already required by the existing application.

The future storage/download strategy can be added separately.

---

# 30. Result Security

Do not render arbitrary provider response data as executable HTML.

For example, do not inject an entire provider response into the DOM.

Only use the validated fields required by the Result component.

If the result is an image URL, use the appropriate image element/component.

Do not allow arbitrary HTML from a provider response.

---

# 31. URL Handling

The application should follow its existing security policy for remote/local image URLs.

Do not blindly trust arbitrary URL schemes.

Where applicable, reject unsafe values such as:

```text
javascript:
```

or other non-image resource schemes.

The exact allowed URL policy should follow the application's deployment architecture.

---

# 32. Accessibility

The generated result image must have meaningful alternative text.

Example:

```text
AI visualization of the selected hardwood flooring in the uploaded room
```

Avoid:

```text
image123.jpg
```

as the only accessible description.

If the generated result cannot be described dynamically, use a useful static description.

---

# 33. Loading Accessibility

The result loading state should be exposed to assistive technology where appropriate.

Example conceptual behavior:

```text
aria-live="polite"
```

for status messaging.

Do not continuously announce changing content.

---

# 34. Result Error Accessibility

Error messages must be:

- readable
- associated with the relevant result area
- keyboard accessible
- understandable without color alone

If a recovery control exists, it must be keyboard accessible.

---

# 35. Mobile Behavior

On mobile:

- result image must fit within the viewport.
- no horizontal overflow.
- no accidental image distortion.
- loading/error messages remain visible.
- result controls remain touch-accessible.
- result state must survive ordinary responsive layout changes.

Do not require desktop-only interactions.

---

# 36. Performance

Result display should avoid unnecessary image duplication.

Do not:

- repeatedly decode the same image unnecessarily.
- create multiple object URLs for the same result without reason.
- retain obsolete result blobs indefinitely.
- keep old results alive after they are no longer needed.

Follow the existing browser/framework lifecycle.

---

# 37. Result Memory Management

If generated results are represented as blob/object URLs:

- release obsolete object URLs when appropriate.
- avoid memory leaks after repeated generations.
- ensure replacing Result A with Result B does not retain A indefinitely.

This must be tested during repeated generation attempts.

---

# 38. Result Component Boundary

Recommended conceptual architecture:

```text
Generation Service
       ↓
Normalized Generation Result
       ↓
Result State
       ↓
Result Component
       ↓
Image Display
```

The Result component should not call the AI provider directly.

---

# 39. No Provider Logic in Result UI

Do not put logic such as:

```js
if (provider === "some-ai-provider") ...
```

inside the Result UI unless there is a genuine provider-independent product requirement.

Provider-specific behavior belongs in the generation/provider layer.

---

# 40. Result Metadata

Only retain metadata that has a clear functional purpose.

Potential fields:

```text
requestId
createdAt
source snapshot
options snapshot
image URL
```

Do not store arbitrary provider response data just because it is available.

---

# 41. Result Persistence

Do not introduce database persistence in this phase unless the existing application already requires it.

V1 Result state can remain in application/session memory.

Persistent Save is explicitly out of scope.

---

# 42. Refresh Behavior

Do not promise that a generated result survives a full browser refresh unless persistence has explicitly been implemented.

If the current architecture loses in-memory state on refresh, that is acceptable for this phase.

Do not add a persistence system solely to avoid this.

---

# 43. Navigation Behavior

If the result is rendered on the same page:

```text
Visualizer → Result state
```

is acceptable.

If the existing application already uses a dedicated result route, preserve that architecture.

Do not create a new routing system solely for this phase.

---

# 44. Result URL/Route State

If routing is used, the route/state must not expose sensitive data.

Do not put:

- source image binary data
- API credentials
- private provider payloads

into query parameters.

A request ID may be used where the existing architecture supports it.

---

# 45. Mock Result Behavior

When Phase 4 uses the mock provider:

```text
Mock Provider
    ↓
Mock Success Result
    ↓
Result Phase
```

The Result phase must treat the mock response using the same normalization and validation pathway as a future real provider response.

Do not create a separate fake Result UI path.

---

# 46. Real Provider Compatibility

The Result phase must remain provider-agnostic.

Future provider changes should ideally affect:

```text
Provider implementation
```

rather than:

```text
Result UI
```

The Result UI should consume the normalized result contract.

---

# 47. Test Scenarios

The implementation must test at least the following.

## RES-TEST-001 — Valid Result

Input:

```text
Valid generation success
+
valid image URL
+
matching request ID
```

Expected:

```text
RESULT_READY
```

---

## RES-TEST-002 — Missing Result

Provider reports success but result is missing.

Expected:

```text
RESULT_ERROR
```

---

## RES-TEST-003 — Missing Image URL

Provider reports success but:

```text
result.imageUrl === null
```

Expected:

```text
RESULT_ERROR
```

---

## RES-TEST-004 — Mismatched Request ID

Active request:

```text
viz_A
```

Response:

```text
viz_B
```

Expected:

```text
result rejected
```

---

## RES-TEST-005 — Image Load Failure

Valid response exists, but browser cannot load image.

Expected:

```text
image display error
```

No blank silent state.

---

## RES-TEST-006 — Slow Old Result

Request A completes after Request B.

Expected:

```text
A cannot overwrite B
```

---

## RES-TEST-007 — Result Replacement

Result A is displayed.

Generation B succeeds.

Expected:

```text
Result B becomes active
```

---

## RES-TEST-008 — Error Recovery

Result display fails.

User initiates a new generation.

Expected:

```text
old result error cleared
new generation proceeds
```

---

## RES-TEST-009 — Configuration Preservation

Result error occurs.

Expected:

```text
source image preserved
options preserved
```

---

## RES-TEST-010 — Mobile

Verify result display on a small viewport.

Expected:

```text
no horizontal overflow
no distortion
usable controls
```

---

## RES-TEST-011 — Accessibility

Verify:

- image alt text
- loading status
- error announcement
- keyboard interaction

---

## RES-TEST-012 — Mock Provider

Result phase works entirely with the Phase 4 mock provider.

---

# 48. Acceptance Criteria

## RES-001 — Result Contract

Result phase accepts the normalized Phase 4 success contract.

---

## RES-002 — Result Validation

Malformed or incomplete success responses are rejected.

---

## RES-003 — Request Matching

Only the active generation request may update the active result.

---

## RES-004 — Result State

A clear `ready`/success state exists.

---

## RES-005 — Image Display

A valid generated image is displayed without distortion.

---

## RES-006 — Image Loading

Image loading state is explicit.

---

## RES-007 — Image Error

Image load failures are handled visibly.

---

## RES-008 — No Fake Success

The application never reports a result when no valid result exists.

---

## RES-009 — Input Preservation

Source image and options remain available after result/display errors.

---

## RES-010 — Result Replacement

A newer valid result replaces the older active result safely.

---

## RES-011 — Stale Result Protection

Old asynchronous results cannot overwrite newer results.

---

## RES-012 — Mock Compatibility

The Result phase works with the mock provider.

---

## RES-013 — Provider Independence

Result UI does not depend on a specific AI vendor.

---

## RES-014 — Accessibility

Result, loading, and error states are accessible.

---

## RES-015 — Mobile

Result display works on mobile without layout-breaking behavior.

---

## RES-016 — No Persistence Assumption

The phase does not falsely promise result persistence across refresh.

---

## RES-017 — No Scope Creep

No Save, Share, Download, CRM, Analytics, Auth, Estimate, Chat, or payment features are added.

---

# 49. Definition of Done

Phase 5 is complete only when:

- [ ] Successful generation results reach the Result layer.
- [ ] Result responses are validated.
- [ ] Request IDs are checked.
- [ ] Stale results are rejected.
- [ ] Valid result images display correctly.
- [ ] Result image loading state works.
- [ ] Result image errors are handled.
- [ ] No fake success is possible.
- [ ] Source image is preserved.
- [ ] Options snapshot is preserved.
- [ ] Newer results replace older results correctly.
- [ ] Result state can recover from errors.
- [ ] Mock provider works through the same result pathway.
- [ ] Result UI is provider-agnostic.
- [ ] Accessibility is verified.
- [ ] Mobile behavior is verified.
- [ ] Memory/resource handling is verified where applicable.
- [ ] Existing Phase 1–4 behavior remains intact.
- [ ] Tests are executed.
- [ ] All acceptance criteria pass.
- [ ] No out-of-scope features were implemented.

---

# 50. Agent Implementation Rules for This Phase

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read `01-PHASE-UPLOAD.md`.
4. Read `02-PHASE-OPTIONS.md`.
5. Read `03-PHASE-VALIDATION.md`.
6. Read `04-PHASE-GENERATE.md`.
7. Read this file completely before coding.
8. Inspect the existing implementation before changing anything.
9. Reuse the Phase 4 normalized result contract.
10. Do not bypass generation state.
11. Do not call an AI provider from the Result UI.
12. Do not implement a real AI provider.
13. Do not implement full Retry functionality.
14. Do not implement Save, Share, Download, CRM, Analytics, Auth, Estimate, Chat, or Payment.
15. Protect against stale results.
16. Preserve source/options state.
17. Validate result data before displaying it.
18. Do not treat HTTP success as image success.
19. Do not fabricate progress or results.
20. Do not add persistence unless already required by the existing architecture.
21. Avoid unnecessary refactoring.
22. Test image-load failures.
23. Test request-ID mismatches.
24. Test repeated generation/result replacement.
25. Report any conflict or ambiguity instead of inventing behavior.
26. Do not mark the phase complete without verification.

---

# 51. Completion Report

When implementation is complete, the coding agent must report:

```text
PHASE:
05 — Result

IMPLEMENTED:
- ...

RESULT STATE:
- ...

RESULT VALIDATION:
- ...

STALE RESULT PROTECTION:
- ...

IMAGE DISPLAY:
- ...

ERROR HANDLING:
- ...

TESTS RUN:
- ...

ACCEPTANCE CRITERIA:
- Passed: ...
- Failed: ...

FILES CHANGED:
- ...

KNOWN ISSUES:
- ...

OUT-OF-SCOPE CHANGES:
- None
```

If any issue remains, it must be explicitly listed.

---

# 52. Phase Exit Condition

Phase 5 exits successfully when the complete core workflow can reliably reach:

```text
UPLOAD
   ↓
OPTIONS
   ↓
VALIDATION
   ↓
GENERATE
   ↓
MOCK GENERATION
   ↓
RESULT
```

with:

```text
Valid request
      ↓
Valid result
      ↓
Result displayed
```

and:

```text
Invalid generation
      ↓
Error
      ↓
No false result
```

and:

```text
Old async result
      ↓
Rejected
      ↓
Cannot overwrite active result
```

The Result layer must now be ready for the next dedicated phase:

```text
06 — RETRY
```

where retry behavior can be implemented without changing the fundamental result contract.

**Phase 5 does not implement Save, Share, Download, CRM, Analytics, or real AI integration.**
