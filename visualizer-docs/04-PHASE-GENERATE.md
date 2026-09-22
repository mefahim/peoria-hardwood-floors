# 04 — PHASE: GENERATE

## 1. Phase Purpose

This phase defines the **generation workflow** that begins after the visualizer input has passed the Phase 3 validation gate.

The primary purpose is to create a reliable, explicit, and testable transition from:

```text
VALID USER INPUT
        ↓
GENERATION REQUEST
        ↓
GENERATION IN PROGRESS
        ↓
GENERATION SUCCESS
   or
GENERATION FAILURE
```

This phase introduces the generation workflow and mock generation provider.

It does **not** require a paid AI API.

The implementation must work fully with a mock provider so the entire generation lifecycle can be developed and tested before connecting a real AI service.

---

# 2. Scope

## 2.1 In Scope

This phase covers:

- Generate action flow.
- Final validation before generation.
- Creation of a normalized visualization request.
- Generation state machine.
- Mock generation provider.
- Provider abstraction.
- Request lifecycle.
- Loading/progress state.
- Duplicate-generation protection.
- Cancellation behavior where technically supported.
- Success response handling.
- Failure response handling.
- Timeout handling.
- Retry preparation.
- Request IDs / correlation IDs.
- Safe handling of asynchronous generation.
- Preservation of user configuration.
- UI behavior during generation.
- Generation-result handoff to the future Result phase.
- Testability without a real AI API.

## 2.2 Out of Scope

Do NOT implement in this phase:

- Real AI provider integration.
- Production AI prompt engineering.
- Real image masking/segmentation.
- Result-page UX beyond the minimum handoff contract.
- Save.
- Share.
- Download.
- CRM.
- Estimate generation.
- Analytics.
- Authentication.
- Chat refinement.
- Subscription/payment.
- New visualizer options.
- Advanced job queues unless the existing backend already requires them.

---

# 3. Dependencies

This phase depends on:

```text
00-MASTER-SPEC.md
01-PHASE-UPLOAD.md
02-PHASE-OPTIONS.md
03-PHASE-VALIDATION.md
AGENT-INSTRUCTIONS.md
```

The required flow is:

```text
Upload
  ↓
Options
  ↓
Validation
  ↓
Generate
```

Generation must never bypass the validation phase.

---

# 4. Core Principle

The Generate action is a **workflow transition**, not merely a button click.

The intended model is:

```text
User clicks Generate
        ↓
Final validation
        ↓
Build normalized request
        ↓
Create generation job/request
        ↓
Generation starts
        ↓
Provider executes
        ↓
Success / Failure / Timeout
```

The UI should never infer success merely because the Generate button was clicked.

---

# 5. Generation State Machine

The generation workflow must have explicit states.

Recommended state model:

```text
IDLE
  ↓
VALIDATING
  ↓
CREATING_REQUEST
  ↓
GENERATING
  ↓
SUCCESS
  or
ERROR
  or
TIMEOUT
```

Optional:

```text
GENERATING
  ↓
CANCELING
  ↓
CANCELED
```

Cancellation should only be implemented when the underlying request mechanism genuinely supports safe cancellation.

Do not fake cancellation by merely hiding the loading UI while the provider continues running.

---

# 6. State Transition Rules

## 6.1 IDLE → VALIDATING

Triggered by:

```text
User clicks Generate
```

Before any generation request is sent.

---

## 6.2 VALIDATING → CREATING_REQUEST

Only when:

```text
validateVisualizerInput(state).valid === true
```

---

## 6.3 VALIDATING → IDLE

When validation fails.

Expected behavior:

- Show validation errors.
- Preserve user input.
- Do not create a generation request.
- Do not call the provider.

---

## 6.4 CREATING_REQUEST → GENERATING

When the generation request/job has been successfully created or the provider invocation has started.

---

## 6.5 CREATING_REQUEST → ERROR

If request creation fails.

Examples:

- network error
- malformed request
- server rejection
- provider unavailable

---

## 6.6 GENERATING → SUCCESS

Only when a valid provider result is received and accepted by the application.

---

## 6.7 GENERATING → ERROR

When generation fails.

---

## 6.8 GENERATING → TIMEOUT

When the configured generation timeout is exceeded.

A timeout must not be reported as success.

---

# 7. Generate Action Contract

Conceptually:

```js
async function handleGenerate() {
  const validation = validateVisualizerInput(state);

  if (!validation.valid) {
    applyValidationErrors(validation);
    return;
  }

  const request = buildVisualizationRequest(state);

  startGeneration(request);
}
```

The actual implementation may be structured differently.

The key rule is:

> No generation request may exist without a successful final validation result.

---

# 8. Normalized Visualization Request

The generation layer must receive a normalized request object rather than raw form state.

Recommended structure:

```js
{
  requestId: string,

  image: {
    source: File,
    fileName: string,
    mimeType: string,
    width: number,
    height: number
  },

  options: {
    roomType: string,
    projectType: string,
    preferredStyle: string,
    customStyleDescription: string,
    woodSpecies: string,
    floorDirection: string,
    finishPreference: string,
    sheen: string,
    serviceCity: string | null,
    squareFootage: number | null
  }
}
```

The exact structure may vary according to the application architecture.

The important requirements are:

- normalized values
- stable internal IDs/values
- no raw UI labels
- no validation ambiguity
- no unnecessary UI-only properties

---

# 9. Request ID

Every generation attempt should have a unique request ID.

Example:

```text
viz_01J...
```

or any existing project-standard UUID.

Purpose:

- tracing
- debugging
- matching async results
- preventing stale results from overwriting newer state

The request ID must not contain sensitive information.

Do not use the original file name as the request ID.

---

# 10. Attempt Identity

A generation attempt must be distinguishable from the overall visualizer session.

Example:

```text
Visualizer Session
    ↓
Generation Attempt #1
    ↓
Generation Attempt #2
```

This becomes especially important in the Retry phase.

Phase 4 should prepare the system so that an old result cannot overwrite a newer generation request.

---

# 11. Provider Abstraction

The generation workflow must not depend directly on a specific AI vendor.

Recommended conceptual interface:

```js
class VisualizationProvider {
  async generate(request) {
    // returns standardized generation result
  }
}
```

Possible implementation:

```text
VisualizationProvider
        ↑
        |
MockVisualizationProvider
```

Later:

```text
VisualizationProvider
        ↑
        |
RealAIVisualizationProvider
```

The UI should depend on the abstraction, not the vendor-specific implementation.

---

# 12. Mock Provider

The mock provider is required for this phase.

It must simulate the same lifecycle shape that a future real AI provider will use.

Recommended behavior:

```text
request
  ↓
mock processing delay
  ↓
success
```

It should also support configurable failure scenarios.

Example development modes:

```text
MOCK_SUCCESS
MOCK_ERROR
MOCK_TIMEOUT
```

These should be development/testing controls, not user-facing production features.

---

# 13. Mock Provider Success

A successful mock response should return a normalized result.

Example:

```js
{
  requestId: "viz_123",
  status: "success",
  result: {
    imageUrl: "/mock/generated-result.jpg"
  }
}
```

The actual result representation may use a local static asset, generated placeholder, or another safe development mechanism.

Do not pretend that the mock image is a real AI-generated visualization.

---

# 14. Mock Provider Failure

The mock provider must be able to simulate failure.

Example:

```js
{
  requestId: "viz_123",
  status: "error",
  error: {
    code: "MOCK_GENERATION_FAILED",
    message: "Mock generation failure."
  }
}
```

The production UI should translate technical errors into user-friendly messages.

---

# 15. Mock Provider Timeout

The mock provider should be capable of simulating a timeout.

The application must distinguish:

```text
SUCCESS
ERROR
TIMEOUT
```

A timeout must not be converted into a generic success or left in an indefinite loading state.

---

# 16. Generation Request Boundary

All provider communication must pass through one generation service or equivalent boundary.

Recommended conceptual architecture:

```text
UI
 ↓
Generate Controller
 ↓
Validation
 ↓
Request Builder
 ↓
Generation Service
 ↓
Provider
```

Do not place provider-specific logic directly inside UI components.

---

# 17. Provider Response Normalization

Different providers may return different formats.

The application should normalize provider responses into one internal contract.

Example:

```js
{
  requestId: string,
  status: "success" | "error" | "timeout",
  result: {
    imageUrl: string
  } | null,
  error: {
    code: string,
    message: string
  } | null
}
```

The UI should consume this normalized structure.

---

# 18. Generation Loading State

While generation is running:

- Generate must not start a second request.
- The current request must remain identifiable.
- The UI must clearly indicate that generation is in progress.
- User input should remain preserved.
- The application must not appear frozen.

The UI may display progress text such as:

```text
Creating your floor visualization…
```

Do not display fake percentage progress unless the provider actually supplies meaningful progress information.

---

# 19. Progress Reporting

For V1, progress should be modeled as:

```text
indeterminate
```

unless real provider progress is available.

Do not show:

```text
37%
72%
94%
```

when those numbers are fabricated.

Fake progress can create misleading expectations.

---

# 20. Generation Duration

Generation may take longer than normal UI interactions.

The implementation must therefore support asynchronous operations correctly.

Do not block the browser thread with synchronous waiting.

Use the existing application framework's standard async pattern.

---

# 21. Duplicate Generate Protection

While generation is active:

```text
GENERATING
```

another Generate request must not start a second active generation for the same interaction.

Possible safeguards:

- disable Generate
- ignore duplicate clicks
- request lock
- generation-state guard

Prefer multiple defensive layers where appropriate.

---

# 22. Double-Click Scenario

Example:

```text
User double-clicks Generate
```

Expected:

```text
1 generation attempt
```

not:

```text
2 generation attempts
```

The test must explicitly cover this scenario.

---

# 23. Stale Result Protection

Consider:

```text
Request A starts
Request A is slow
Request B starts later
Request B completes
Request A completes afterward
```

Request A must not overwrite the state/result belonging to Request B.

Every async response should be associated with its request ID or attempt identity.

---

# 24. User Input During Generation

During generation, the application must define predictable behavior for input changes.

For V1, the recommended rule is:

> Do not silently modify the active generation request after generation starts.

The request should contain a snapshot of validated state at the time Generate was clicked.

Therefore:

```text
Generation Request
        ↓
Immutable request snapshot
```

If the UI permits editing options while generation is running, those changes must NOT mutate the already-running request.

The simplest V1 behavior is to disable or otherwise prevent configuration edits during generation.

---

# 25. Input Preservation

The original user configuration should remain available for:

- result display
- retry
- debugging
- future comparison

Do not destroy the configuration immediately after starting generation.

---

# 26. Source Image Handling

The generation request must reference the validated source image.

The generation phase must not unexpectedly replace the source image.

The source image should remain logically associated with the generation attempt.

---

# 27. Backend Boundary

If generation is implemented through a backend endpoint, the recommended architecture is:

```text
Browser
   ↓
POST /api/visualizer/generate
   ↓
Server validation
   ↓
Generation service
   ↓
Provider
   ↓
Normalized response
   ↓
Browser
```

The exact route can follow the existing project architecture.

Do not invent an API route if the application already has an established API convention.

---

# 28. Client-Side vs Server-Side Validation

Phase 3 validates on the client for user experience.

Phase 4 must assume that the server cannot trust the client.

If a backend endpoint exists, it should validate again.

Correct:

```text
Client validation
      +
Server validation
```

Do not remove server validation merely because the client already validated.

---

# 29. File Transfer to Backend

If the source image must be uploaded to the backend:

- use the application's established upload mechanism.
- use an appropriate multipart/form-data strategy where required.
- enforce server-side file constraints.
- do not convert large binary images to oversized JSON strings unless there is a concrete architectural reason.
- do not expose filesystem paths to the browser.

Do not implement a new storage architecture in this phase unless the existing generation architecture requires it.

---

# 30. Payload Size

Generation requests must not grow unnecessarily large.

Do not include:

- unused UI metadata
- full option label dictionaries
- repeated state snapshots
- debug objects
- browser-only data

Only include information required by the generation layer.

---

# 31. AI Prompt Responsibility

Phase 4 may define a placeholder provider request, but it must NOT finalize production AI prompting.

The future AI phase will own:

- provider-specific prompting
- system instructions
- image-editing constraints
- negative constraints
- provider-specific parameters
- model selection
- output dimensions
- masking strategy if required

For Phase 4, the generation service should simply pass the normalized visualization request to the provider abstraction.

---

# 32. Image Editing Semantics

The future real provider is expected to perform image editing rather than create an unrelated room image.

The generation request should preserve the semantic intent:

```text
Same room
+
same camera perspective
+
same architecture
+
same furniture/non-floor objects where possible
+
changed visible flooring
```

However, Phase 4 must not attempt to solve image-editing quality itself.

That belongs to the real AI integration phase.

---

# 33. Generation Result Contract

The minimum normalized success contract should be future-compatible.

Recommended:

```js
{
  requestId: string,
  status: "success",

  result: {
    imageUrl: string
  }
}
```

Future fields may include:

```text
provider
model
metadata
width
height
createdAt
```

but they are not required for Phase 4.

---

# 34. Result Validation

A provider response must not be accepted blindly.

For success:

- request ID must match.
- status must indicate success.
- result object must exist.
- result image reference must be present.

If required result information is missing, treat it as an error.

Example:

```text
Provider says success
BUT
imageUrl is missing
```

Expected:

```text
ERROR
```

not:

```text
SUCCESS
```

---

# 35. Error Categories

Recommended internal categories:

```text
VALIDATION_ERROR
REQUEST_CREATION_ERROR
NETWORK_ERROR
PROVIDER_ERROR
TIMEOUT_ERROR
INVALID_PROVIDER_RESPONSE
CANCELED
UNKNOWN_GENERATION_ERROR
```

Use stable internal codes.

User-facing messages should remain simple.

---

# 36. User-Facing Generation Errors

Examples:

Bad:

```text
AxiosError: ECONNRESET
```

Better:

```text
We couldn't create the visualization. Please try again.
```

For timeout:

```text
The visualization is taking longer than expected. Please try again.
```

For provider failure:

```text
We couldn't generate the visualization right now. Please try again.
```

Do not expose:

- API keys
- provider secrets
- internal stack traces
- database details
- server filesystem paths

---

# 37. Network Failure

If the generation request cannot reach the server/provider:

```text
NETWORK_ERROR
```

Expected behavior:

- stop loading
- show actionable error
- preserve form state
- preserve source image
- allow a future retry path
- do not claim success

---

# 38. Server Error

For server-side failure:

```text
5xx
```

the client must transition out of loading.

Do not leave:

```text
GENERATING
```

forever.

---

# 39. Timeout

The generation service must have a defined timeout strategy.

The exact timeout should be configurable rather than hard-coded across multiple files.

Example conceptual configuration:

```js
GENERATION_TIMEOUT_MS
```

The value may be selected based on the actual provider once integrated.

For mock development, use a shorter configurable timeout.

---

# 40. Timeout Handling

When timeout is reached:

```text
GENERATING
    ↓
TIMEOUT
```

The UI must:

- stop the loading state
- preserve the current input
- show a clear message
- avoid treating the request as successfully completed

Important:

A client timeout does not necessarily mean the provider stopped processing server-side.

Therefore, do not claim:

```text
The provider definitely stopped.
```

Unless the backend/provider confirms cancellation.

---

# 41. Retry Preparation

Actual Retry behavior is a later phase.

However, Phase 4 must preserve enough state to support it.

Store or retain:

```text
source image
validated options snapshot
generation attempt identity
result/error state
```

Do not implement a separate retry system yet.

---

# 42. Generation State Storage

Recommended conceptual state:

```js
{
  status: "idle",

  requestId: null,

  request: null,

  result: null,

  error: null
}
```

Possible statuses:

```text
idle
validating
creating_request
generating
success
error
timeout
```

The actual project may already have a state-management approach.

Reuse it rather than introducing unnecessary global state.

---

# 43. Reset Behavior

Resetting the generation state must not accidentally erase:

- source image
- selected options

unless the user intentionally starts a new visualizer session or replacement workflow.

For example:

```text
Generation error
     ↓
Reset generation state
```

should usually result in:

```text
image preserved
options preserved
generation status → idle
error → cleared
```

---

# 44. Result Handoff

Phase 4 should prepare a clean handoff to Phase 6 Result.

On success:

```text
Generation Service
        ↓
Normalized Success
        ↓
Result State
        ↓
Future Result UI
```

The Phase 4 implementation should not duplicate the future Result screen.

---

# 45. Success State

A successful generation must transition to:

```text
SUCCESS
```

only after the result has passed response validation.

The UI may then display a minimal success indicator or route/render placeholder according to the existing application structure.

The full Result experience belongs to the later Result phase.

---

# 46. No Fake Success

This rule is critical.

The application must never enter:

```text
SUCCESS
```

because:

- the request was sent
- a promise resolved without checking content
- the server returned HTTP 200 with malformed data
- the mock provider was called
- the user waited a certain amount of time

Success requires a valid normalized result.

---

# 47. Logging

Generation should support useful debugging logs in development.

Useful information:

```text
requestId
generation status
duration
provider result category
```

Do not log:

- API keys
- authentication tokens
- raw sensitive image contents
- unnecessary personal information
- full provider secrets

Production logging should follow the project's existing logging strategy.

---

# 48. Performance

The generation UI must not introduce unnecessary client-side processing.

Avoid:

- repeated image encoding
- duplicate image transformations
- repeated validation passes caused by renders
- excessive state serialization

Validation should happen:

```text
once before request creation
```

unless another explicit validation step is required.

---

# 49. Memory Management

If object URLs are used for image previews or mock generated assets:

- revoke old object URLs where appropriate.
- avoid creating unnecessary duplicate blob URLs.
- ensure repeated generation attempts do not leak browser memory.

This is especially important when testing many retries.

---

# 50. Browser Navigation During Generation

The implementation must behave predictably if the user navigates away while a generation request is active.

Do not claim cancellation unless the request was actually canceled.

If browser lifecycle handling is implemented, it must not create misleading UI state.

Advanced background persistence is out of scope unless required by the existing architecture.

---

# 51. Accessibility During Generation

While generating:

- the loading state must be perceivable.
- status text should be announced appropriately when possible.
- disabled controls must remain understandable.
- focus must not become trapped unexpectedly.
- keyboard users must still have a logical interaction path.

Do not use animation as the only indication of progress.

---

# 52. Mobile During Generation

On small screens:

- generation status must remain visible.
- the UI must not overflow.
- controls must remain touch-accessible.
- accidental duplicate taps must not create multiple requests.

---

# 53. Test Scenarios

The implementation must test at least the following.

## GEN-TEST-001 — Valid Generate

```text
Valid image
+
all required valid options
```

Expected:

```text
VALIDATING
→ CREATING_REQUEST
→ GENERATING
→ SUCCESS
```

---

## GEN-TEST-002 — Missing Image

Expected:

```text
VALIDATING
→ validation failure
→ no provider call
```

---

## GEN-TEST-003 — Missing Required Option

Expected:

```text
validation failure
→ no provider call
```

---

## GEN-TEST-004 — Invalid Controlled Value

Expected:

```text
validation failure
→ no provider call
```

---

## GEN-TEST-005 — Mock Error

Mock provider returns failure.

Expected:

```text
GENERATING
→ ERROR
```

---

## GEN-TEST-006 — Mock Timeout

Expected:

```text
GENERATING
→ TIMEOUT
```

---

## GEN-TEST-007 — Malformed Success

Mock/provider returns:

```js
{
  status: "success"
}
```

without a valid result image.

Expected:

```text
ERROR
```

---

## GEN-TEST-008 — Double Click

User clicks Generate twice rapidly.

Expected:

```text
one generation request
```

---

## GEN-TEST-009 — Slow Old Request

Request A starts.

Request B becomes the active attempt.

Request A finishes later.

Expected:

```text
A cannot overwrite B
```

---

## GEN-TEST-010 — User Configuration Preservation

Generation fails.

Expected:

```text
image preserved
options preserved
```

---

## GEN-TEST-011 — Recovery

Generation error occurs.

The user starts a new valid generation attempt.

Expected:

```text
old error cleared
new request starts normally
```

---

## GEN-TEST-012 — No Real API Dependency

Entire phase passes with:

```text
MOCK provider
```

without a paid AI API.

---

# 54. Acceptance Criteria

## GEN-001 — Validation Gate

Every generation attempt performs final validation before provider execution.

---

## GEN-002 — Normalized Request

Provider receives a normalized visualization request.

---

## GEN-003 — Provider Abstraction

UI does not depend directly on a vendor-specific provider implementation.

---

## GEN-004 — Mock Provider

A working mock provider exists.

---

## GEN-005 — Explicit States

Generation states are explicit and testable.

---

## GEN-006 — Loading State

The UI clearly represents active generation.

---

## GEN-007 — Duplicate Protection

One user interaction cannot accidentally start multiple active generations.

---

## GEN-008 — Request Identity

Each generation attempt has a unique request ID or equivalent identity.

---

## GEN-009 — Stale Response Protection

Old asynchronous results cannot overwrite newer generation state.

---

## GEN-010 — Success Validation

Success requires a valid provider response.

---

## GEN-011 — Error Handling

Generation errors stop the loading state and produce actionable feedback.

---

## GEN-012 — Timeout Handling

Generation timeout is handled explicitly.

---

## GEN-013 — Input Preservation

User input survives generation failure.

---

## GEN-014 — No Fake Progress

No fabricated percentage progress is shown.

---

## GEN-015 — No Real AI Requirement

The phase is fully testable using the mock provider.

---

## GEN-016 — No Secrets

No provider credentials or secrets are exposed to the browser.

---

## GEN-017 — Server Validation

Where a backend exists, server-side validation remains required.

---

## GEN-018 — Result Handoff

Successful generation produces a normalized result suitable for the future Result phase.

---

## GEN-019 — Accessibility

Generation/loading/error states are accessible.

---

## GEN-020 — Mobile

Generation workflow remains usable on mobile.

---

## GEN-021 — No Scope Creep

No Save, Share, CRM, Analytics, Auth, Estimate, Chat, or other out-of-scope features are added.

---

# 55. Definition of Done

Phase 4 is complete only when:

- [ ] Generate passes through final validation.
- [ ] A normalized request is built.
- [ ] A generation service/provider boundary exists.
- [ ] Mock provider works.
- [ ] Generation states are explicit.
- [ ] Loading UI works.
- [ ] Duplicate clicks are prevented.
- [ ] Request IDs exist.
- [ ] Stale results are protected against.
- [ ] Provider responses are normalized.
- [ ] Success requires valid result data.
- [ ] Errors are handled.
- [ ] Timeouts are handled.
- [ ] User input is preserved on failure.
- [ ] Retry-relevant state is preserved.
- [ ] No real AI API is required.
- [ ] No API secrets are exposed.
- [ ] Existing upload/options/validation behavior remains intact.
- [ ] Test scenarios are executed.
- [ ] All acceptance criteria pass.
- [ ] No out-of-scope features were implemented.

---

# 56. Agent Implementation Rules for This Phase

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read `01-PHASE-UPLOAD.md`.
4. Read `02-PHASE-OPTIONS.md`.
5. Read `03-PHASE-VALIDATION.md`.
6. Read this file completely before coding.
7. Inspect the existing visualizer code before making changes.
8. Reuse existing architecture where practical.
9. Do not connect a paid AI provider.
10. Do not assume OpenAI, Gemini, Stability, Replicate, or another provider.
11. Do not hard-code a vendor-specific architecture into the UI.
12. Implement the provider behind an abstraction.
13. Use a mock provider for this phase.
14. Do not invent production prompt logic.
15. Do not implement full Result or Retry UX.
16. Do not add Save, Share, CRM, Analytics, Auth, Estimate, Chat, or Payment.
17. Do not bypass Phase 3 validation.
18. Do not create fake progress percentages.
19. Prevent duplicate generation requests.
20. Protect against stale async responses.
21. Preserve user input.
22. Do not expose secrets.
23. Test failure and timeout scenarios.
24. Keep changes minimal and compatible with the current application.
25. Report all unresolved ambiguity or architecture conflicts.
26. Do not mark the phase complete without verification.

---

# 57. Completion Report

When implementation is complete, the coding agent must report:

```text
PHASE:
04 — Generate

IMPLEMENTED:
- ...

GENERATION STATES:
- ...

MOCK PROVIDER:
- ...

ERROR / TIMEOUT HANDLING:
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

If real AI integration was intentionally not implemented, state clearly:

```text
Real AI provider integration was not implemented in Phase 4.
Mock provider is active for development/testing.
```

---

# 58. Phase Exit Condition

Phase 4 exits successfully when:

```text
Valid User Input
      ↓
Final Validation
      ↓
Normalized Generation Request
      ↓
Generation Service
      ↓
Mock Provider
      ↓
SUCCESS / ERROR / TIMEOUT
```

works reliably without a real AI API.

The generation layer must now be ready for the next phase:

```text
05 — AI INTEGRATION
```

where the mock provider can eventually be replaced or supplemented by a real image-editing provider without rewriting the visualizer's core UI/state architecture.

**Phase 4 does not purchase, configure, or depend on a paid AI API.**
