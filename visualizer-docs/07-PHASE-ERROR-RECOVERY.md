# 07 — PHASE: ERROR RECOVERY

## 1. Phase Purpose

This phase defines the **error handling and recovery architecture** for the Peoria Hardwood Floors Visualizer.

The goal is to ensure that failures throughout the visualizer never leave the user in an ambiguous, frozen, or destructive state.

The visualizer must always make it clear:

```text
What happened?
What is still safe?
What can the user do next?
```

The core recovery principle is:

```text
ERROR
  ↓
CLASSIFY
  ↓
PRESERVE VALID STATE
  ↓
SHOW ACTIONABLE FEEDBACK
  ↓
RECOVER OR EXIT SAFELY
```

This phase is not a collection of individual error messages.

It defines the system-wide rules for recovering from failures across:

- upload
- options
- validation
- generation
- result loading
- retry
- browser/network conditions

---

# 2. Scope

## 2.1 In Scope

This phase covers:

- Error taxonomy.
- Error classification.
- Recoverable vs non-recoverable errors.
- Error state transitions.
- User-facing error messages.
- Recovery actions.
- State preservation.
- Retry eligibility.
- Upload failure recovery.
- Validation failure recovery.
- Generation failure recovery.
- Timeout recovery.
- Result/display failure recovery.
- Network failure recovery.
- Unknown/unexpected error handling.
- Duplicate-action failure protection.
- Stale-response handling.
- Error reset/clear behavior.
- Error logging principles.
- Error boundaries where appropriate.
- Accessibility of errors.
- Mobile error behavior.
- Testing and acceptance criteria.

## 2.2 Out of Scope

Do NOT implement in this phase:

- Real AI provider integration.
- Provider-specific retry strategies.
- Save.
- Share.
- Download.
- CRM.
- Analytics.
- Authentication.
- Payment.
- Chat refinement.
- New visualizer options.
- Advanced monitoring infrastructure.
- External error-monitoring platform setup unless already present.
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
05-PHASE-RESULT.md
06-PHASE-RETRY.md
AGENT-INSTRUCTIONS.md
```

The system now has the following functional flow:

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
  ↓
Retry
```

This phase defines what happens when any stage fails.

---

# 4. Core Principle

Every expected failure must have:

1. A known internal category.
2. A controlled state transition.
3. A user-safe message.
4. A recovery path where recovery is possible.
5. No loss of unrelated valid state.

A failure must never produce:

```text
Blank screen
+
stuck spinner
+
lost configuration
+
false success
```

---

# 5. Error Taxonomy

Recommended high-level error categories:

```text
UPLOAD_ERROR
VALIDATION_ERROR
REQUEST_ERROR
NETWORK_ERROR
GENERATION_ERROR
TIMEOUT_ERROR
RESULT_ERROR
STATE_ERROR
UNKNOWN_ERROR
```

More specific error codes may exist beneath these categories.

Example:

```text
GENERATION_ERROR
    ├─ PROVIDER_ERROR
    ├─ SERVER_ERROR
    ├─ INVALID_PROVIDER_RESPONSE
    └─ GENERATION_REJECTED
```

---

# 6. Error Categories vs Error Codes

Do not use one string for every error.

Separate:

```text
category
```

from:

```text
code
```

Example:

```js
{
  category: "GENERATION_ERROR",
  code: "PROVIDER_UNAVAILABLE",
  message: "We couldn't create the visualization right now."
}
```

This allows:

- UI mapping
- logging
- debugging
- future analytics
- provider-specific mapping

without exposing technical details to the user.

---

# 7. Error Object Contract

Recommended internal contract:

```js
{
  category: string,
  code: string,

  message: string,

  recoverable: boolean,

  retryable: boolean,

  requestId: string | null,

  field: string | null
}
```

Optional metadata:

```js
{
  timestamp: string,
  cause: unknown
}
```

Do not expose `cause` directly to users.

---

# 8. User-Facing vs Internal Errors

Every error has two conceptual layers.

### Internal

For developers:

```text
PROVIDER_TIMEOUT
requestId=viz_123
```

### User-facing

For users:

```text
The visualization is taking longer than expected. Please try again.
```

Never expose raw internal exceptions as normal user messages.

---

# 9. Error Message Principles

User-facing errors should be:

- clear
- concise
- actionable
- non-technical
- contextual
- honest

Avoid:

```text
Something went wrong.
```

when a more useful message is possible.

Prefer:

```text
We couldn't create the visualization. Please try again.
```

---

# 10. No False Explanation

The application must not invent a reason when the actual reason is unknown.

For example, do not say:

```text
Your image is too dark.
```

unless image analysis actually verified that condition.

If the cause is unknown:

```text
We couldn't complete the request. Please try again.
```

is safer.

---

# 11. Recoverable vs Non-Recoverable Errors

Every error should be classified.

### Recoverable

The user or system can continue without restarting the entire application.

Examples:

```text
invalid option
generation failure
timeout
result image load failure
network interruption
```

### Non-Recoverable

The current visualizer session cannot safely continue from its current state.

Examples may include:

```text
corrupted application state
critical initialization failure
unsupported browser capability
```

Even then, provide the safest possible reset path.

---

# 12. Recovery Matrix

Recommended conceptual matrix:

| Error | Preserve Input | Retry | Replace Input | Start New |
|---|---:|---:|---:|---:|
| Invalid upload | Yes | No | Yes | Yes |
| Validation error | Yes | No | No | No |
| Generation error | Yes | Yes | No | Yes |
| Timeout | Yes | Yes | No | Yes |
| Result error | Yes | Yes | No | Yes |
| Network error | Yes | Usually | No | Yes |
| Corrupted state | Maybe | No | Maybe | Yes |
| Unknown error | Yes where safe | Context-dependent | No | Yes |

The exact UI action should follow the stage that failed.

---

# 13. Upload Error Recovery

Upload errors are primarily handled by Phase 1 but must follow the global error model.

Possible causes:

- unsupported format
- file too large
- dimensions too small
- unreadable/corrupt image
- file access failure
- unexpected browser error

Expected behavior:

```text
Invalid new file
      ↓
Show error
      ↓
Keep existing valid image if one exists
      ↓
Allow replacement
```

Never delete a valid existing image merely because a replacement file failed.

---

# 14. Upload Error With No Existing Image

If no valid source exists:

```text
Upload failure
```

must result in:

```text
error
+
upload/reselect action
```

Do not create an empty result state that appears usable.

---

# 15. Validation Error Recovery

Validation failures are user-correctable.

Example:

```text
Room Type missing
```

Expected:

```text
show field error
+
preserve all valid fields
+
user corrects field
+
error clears
```

Do not send a generation request.

---

# 16. Validation Error Persistence

Validation errors should remain visible until:

- the field is corrected, or
- the validation state is intentionally reset.

Do not clear validation errors merely because the component re-rendered.

---

# 17. Validation Error Scope

A validation error should be scoped to the affected input.

Example:

```text
Square Footage invalid
```

should not cause:

```text
Room Type error
Wood Species error
```

unless those fields are also invalid.

---

# 18. Generate Request Error

A generation request can fail before the actual AI/provider processing begins.

Examples:

```text
request creation failed
server rejected request
network unavailable
```

Expected:

```text
stop loading
+
show actionable error
+
preserve source/options
+
allow recovery
```

---

# 19. Generation Error Recovery

For:

```text
GENERATION_ERROR
```

recommended path:

```text
ERROR
 ↓
Preserve snapshot
 ↓
Show message
 ↓
Retry available
```

The original snapshot must remain intact.

---

# 20. Timeout Recovery

Timeout must never leave the UI in:

```text
GENERATING
```

forever.

Correct:

```text
GENERATING
    ↓
TIMEOUT
    ↓
stop loading
    ↓
preserve snapshot
    ↓
allow Retry
```

The system must not claim that the remote generation definitely stopped unless cancellation was confirmed.

---

# 21. Network Error Recovery

Network failures may happen during:

- request creation
- polling, if used
- result image loading

The application should distinguish the user-visible consequence while keeping the same core rule:

```text
No false success
+
No stuck loading
+
Preserve valid state
```

A generic user-facing message is acceptable:

```text
We couldn't connect to the service. Please check your connection and try again.
```

Do not state that the user's device is offline unless the application actually verified that condition.

---

# 22. Result Validation Error

Provider may return a success-shaped response that is incomplete.

Example:

```js
{
  status: "success",
  result: {}
}
```

Expected:

```text
RESULT_ERROR
```

not:

```text
RESULT_READY
```

---

# 23. Result Image Load Failure

Generation can succeed while image display fails.

Example:

```text
Provider:
success

Browser:
image URL failed
```

Expected:

```text
RESULT_DISPLAY_ERROR
```

The user should receive a clear recovery action.

Recommended:

```text
We couldn't display the visualization. Please try again.
```

---

# 24. Stale Response Errors

A stale response is not necessarily a user-facing error.

Example:

```text
Request A
↓
Request B
↓
B completes
↓
A completes later
```

A should simply be ignored if it is stale.

Do not show:

```text
Generation failed
```

for a deliberately ignored stale result.

Log it in development if useful.

---

# 25. Duplicate Action Handling

Duplicate actions must be prevented, not treated as normal provider failures.

Examples:

```text
double-click Generate
rapid Retry taps
```

Expected:

```text
one active request
```

A second action can be ignored safely while the current operation is active.

Do not create unnecessary error notifications for normal accidental double clicks.

---

# 26. Error Clearing

Errors must be cleared at the correct boundary.

Example:

```text
Generation Error A
   ↓
Retry starts
   ↓
Error A cleared/replaced
```

Do not leave an old error visible as if it applies to the new attempt.

Similarly:

```text
Field invalid
   ↓
Field fixed
   ↓
Field error clears
```

---

# 27. Error Replacement

Only one active error should represent the current operation state when possible.

Example:

```text
Old generation error
+
new generation attempt
```

should result in:

```text
current generation state
+
current error only
```

Historical error details may exist in logs/state metadata but should not clutter the active UI.

---

# 28. Preserve Valid State

This is a global rule.

When an error occurs:

```text
valid state → preserve
invalid state → show error
```

Do not reset unrelated state.

Example:

```text
Valid Image
Valid Room Type
Valid Wood Species
Generation Error
```

must remain:

```text
Valid Image
Valid Room Type
Valid Wood Species
Generation Error
```

not:

```text
Empty Form
```

---

# 29. Do Not Destroy User Input on Recovery

Recovery logic must never use broad resets such as:

```js
resetVisualizer()
```

unless the user explicitly chose:

```text
Start New
```

or another intentionally destructive action.

Prefer targeted state changes.

---

# 30. Start New Session

A "Start New" action may intentionally clear current state.

This is different from recovery.

If implemented by the existing UI:

```text
Start New
```

may clear:

- source image
- options
- result
- errors
- generation state
- retry snapshot

The action must be explicit.

---

# 31. Recovery Hierarchy

Prefer the least destructive recovery first.

Example:

```text
Fix field
   ↓
Retry request
   ↓
Replace input
   ↓
Start new
```

Do not force users to restart the entire workflow when a smaller recovery is possible.

---

# 32. Error Boundaries

If the frontend framework supports an error boundary or equivalent, use it for unexpected rendering/runtime failures.

Purpose:

```text
unexpected component crash
        ↓
fallback UI
        ↓
prevent entire-page blank screen
```

The fallback should provide a safe recovery path.

Example:

```text
We hit an unexpected problem.
Please reload the visualizer or start a new visualization.
```

Do not expose stack traces.

---

# 33. Error Boundary Scope

Do not wrap the entire application in a giant generic boundary if the existing architecture supports more targeted boundaries.

Prefer boundaries around:

```text
Visualizer feature
```

where possible.

A feature failure should not unnecessarily crash unrelated site functionality.

---

# 34. Initialization Errors

If the visualizer cannot initialize correctly:

Examples:

- missing configuration
- malformed option definitions
- unavailable required module

the application must fail visibly.

Do not render a partially functional UI that silently lacks required behavior.

---

# 35. Configuration Errors

Configuration errors are typically development/infrastructure issues.

Users should not see raw configuration values.

Example internal:

```text
SERVICE_CITY_OPTIONS undefined
```

User-facing:

```text
We couldn't load the visualizer correctly. Please try again later.
```

Development logs should identify the actual missing configuration.

---

# 36. Unknown Errors

Unexpected errors must have a safe fallback.

Conceptually:

```js
catch (error) {
  normalizeUnknownError(error);
}
```

The application must not assume that every thrown value is:

```js
Error
```

Possible thrown values:

```text
string
object
null
unknown value
```

Normalize safely.

---

# 37. Unknown Error Message

Recommended:

```text
We couldn't complete this visualization. Please try again.
```

Optionally:

```text
Please reload the visualizer if the problem continues.
```

Do not guess the root cause.

---

# 38. Error Normalization

Create one shared error-normalization mechanism where practical.

Conceptual:

```js
normalizeError(error, context)
```

It should produce the internal error contract.

This avoids scattered mappings such as:

```text
fetch catch
component catch
provider catch
image catch
```

all producing inconsistent structures.

---

# 39. Error Context

Errors should preserve safe contextual information where useful.

Example:

```js
{
  category: "GENERATION_ERROR",
  code: "PROVIDER_UNAVAILABLE",
  requestId: "viz_123"
}
```

Potential context:

```text
phase
requestId
operation
```

Do not include sensitive image contents.

---

# 40. Error Logging

Development logging should be useful but safe.

Good:

```text
Generation failed
requestId=viz_123
code=TIMEOUT_ERROR
```

Bad:

```text
API_KEY=...
```

Bad:

```text
full uploaded image binary
```

Bad:

```text
complete private provider payload
```

---

# 41. Logging Levels

Where the existing project supports levels, prefer:

```text
info
warn
error
```

Examples:

- expected stale result → `debug`/`info`
- recoverable provider failure → `warn`/`error`
- unexpected runtime crash → `error`

Do not introduce a new logging framework solely for this phase.

---

# 42. Sensitive Data

Do not place sensitive data inside error messages or logs.

Potentially sensitive information includes:

- API keys
- access tokens
- signed private URLs where inappropriate
- raw file contents
- private server paths
- unnecessary user data

---

# 43. Retryability Mapping

Not every error should automatically be marked retryable.

Examples:

```text
FIELD_REQUIRED
→ not retryable

INVALID_OPTION_VALUE
→ not retryable until input changes

PROVIDER_UNAVAILABLE
→ retryable

TIMEOUT_ERROR
→ retryable

RESULT_IMAGE_INVALID
→ often retryable

CORRUPTED_STATE
→ may require reset
```

Retryability must reflect actual recovery possibilities.

---

# 44. Error Action Contract

A normalized error may expose suggested actions.

Conceptually:

```js
{
  category: "GENERATION_ERROR",
  code: "PROVIDER_UNAVAILABLE",
  recoverable: true,
  retryable: true,
  actions: ["retry"]
}
```

The UI may map these to actual controls.

Do not force every error to expose every action.

---

# 45. Action Mapping

Recommended actions:

```text
fix_input
replace_image
retry
start_new
reload
dismiss
```

Actions must only appear when they make sense.

Example:

```text
Invalid room type
→ fix_input
```

not:

```text
retry
```

because the request is invalid.

---

# 46. Dismissible Errors

Only non-blocking informational errors should be freely dismissible.

Do not allow users to dismiss a blocking validation or generation error while leaving the application in an unusable ambiguous state.

The user must still have a clear path forward.

---

# 47. Error UI Consistency

The visualizer should use a consistent error presentation model.

Do not implement:

```text
upload errors → toast only
generation errors → modal
result errors → red banner
```

without a functional reason.

The exact UI can vary, but behavior should remain understandable and accessible.

---

# 48. Toast Usage

Toasts may be used for supplementary notifications.

Do not rely on toasts alone for critical errors.

Critical errors should remain visible near the affected workflow.

---

# 49. Modal Usage

Avoid blocking modals for routine recoverable errors.

A modal should only be used when a user decision is genuinely required.

---

# 50. Error Message Persistence During Async Work

When a new request begins:

```text
previous operation error
```

should be cleared/replaced.

During the new request:

```text
loading state
```

should be the primary active status.

Do not show:

```text
Retrying…
+
Previous generation failed permanently
```

unless there is a genuine need to communicate historical context.

---

# 51. Recovery and Result State

If a result exists and a non-destructive error occurs elsewhere, do not automatically erase the result.

Example:

```text
Result exists
+
unrelated UI validation issue
```

should not delete the result.

Only the state directly invalidated by the error should be changed.

---

# 52. Recovery and Source Image

If the source image is valid, keep it through recoverable errors.

The only expected cases for losing it are:

- user explicitly removes/replaces it
- browser/application cannot retain the reference
- a deliberate new session reset

---

# 53. Recovery and Options

Valid option selections must survive recoverable errors.

Example:

```text
Generation timeout
```

must not clear:

```text
Room Type
Project Type
Style
Wood Species
Direction
Finish
Sheen
```

---

# 54. Recovery After Reload

Persistent recovery across full page reload is out of scope unless already implemented.

Do not create localStorage/session persistence solely for this phase.

If state is lost after refresh, communicate the limitation rather than pretending recovery exists.

---

# 55. Browser Capability Failures

If the application requires browser capabilities that are missing:

```text
unsupported feature
```

show a clear fallback.

Do not silently disable critical functionality.

If the feature can degrade safely, prefer graceful degradation.

---

# 56. Offline State

Do not claim that the browser is offline unless the application has actually detected a relevant offline condition.

When a network request fails:

```text
We couldn't connect to the service. Please check your connection and try again.
```

is safer than:

```text
You are offline.
```

---

# 57. Abort/Cancellation Handling

If the browser/framework uses abort signals or cancellation:

A deliberate cancellation should not always be treated as an unexpected error.

Recommended internal category:

```text
CANCELED
```

For example:

```text
User leaves the workflow
```

may result in:

```text
CANCELED
```

rather than:

```text
GENERATION_ERROR
```

Only implement real cancellation where the current architecture supports it.

---

# 58. Cleanup After Errors

After an operation fails:

- remove/clear loading state
- release temporary resources where appropriate
- keep valid user state
- clear stale progress indicators
- ensure controls return to a usable state

Do not leave:

```text
disabled button
+
spinner
```

after the operation has already failed.

---

# 59. Preventing Stuck States

The implementation must ensure every async operation has a terminal path.

Examples:

```text
loading
→ success

loading
→ error

loading
→ timeout

loading
→ canceled
```

There must not be an unbounded state:

```text
loading forever
```

---

# 60. Error Recovery and State Machine Integrity

An error transition must return the application to a valid known state.

Example:

```text
GENERATING
   ↓
ERROR
```

not:

```text
GENERATING
+
ERROR
+
SUCCESS
```

simultaneously.

The state machine must prevent contradictory states.

---

# 61. Concurrency Rules

Only one active generation attempt should control the active generation/result state for the V1 flow.

If concurrent background requests ever exist in the future, they must have independent identities and result ownership.

Do not introduce concurrency now.

---

# 62. Error Ownership

Each error must belong to an operation.

Examples:

```text
uploadError
validationError
generationError
resultError
```

Avoid one global error string that can be overwritten by unrelated operations.

---

# 63. Field Errors vs Operation Errors

### Field Error

Examples:

```text
roomType required
squareFootage invalid
```

Associated with a field.

### Operation Error

Examples:

```text
generation timeout
result image failed
```

Associated with an async operation.

Do not display operation errors as if they were field errors.

---

# 64. Error Recovery Testing Matrix

The agent should verify at least:

| Scenario | Error | State Preserved | Recovery |
|---|---|---:|---|
| Invalid upload | Upload error | Existing image | Replace |
| Missing option | Validation error | Yes | Fix field |
| Invalid option | Validation error | Yes | Fix field |
| Provider failure | Generation error | Yes | Retry |
| Timeout | Timeout | Yes | Retry |
| Result malformed | Result error | Yes | Retry |
| Result image broken | Result display error | Yes | Retry |
| Stale response | Ignored | Yes | Continue |
| Runtime crash | Error boundary | As safe | Reload/New |
| Unknown error | Unknown | As safe | Retry/New |

---

# 65. Acceptance Criteria

## ERR-001 — Error Taxonomy

Major error categories are defined consistently.

---

## ERR-002 — Structured Errors

Errors use structured category/code information.

---

## ERR-003 — User-Safe Messages

Raw technical exceptions are not shown to users.

---

## ERR-004 — No False Success

Errors cannot result in a false success state.

---

## ERR-005 — No Stuck Loading

Expected async failures always exit loading state.

---

## ERR-006 — State Preservation

Recoverable errors preserve valid user input.

---

## ERR-007 — Correct Recovery

Each major error type exposes an appropriate recovery path.

---

## ERR-008 — Upload Recovery

Invalid replacement uploads do not destroy an existing valid image.

---

## ERR-009 — Validation Recovery

Validation errors clear after the underlying field is corrected.

---

## ERR-010 — Generation Recovery

Generation failures preserve the request snapshot and allow retry where appropriate.

---

## ERR-011 — Timeout Recovery

Timeouts stop loading and preserve retryable state.

---

## ERR-012 — Result Recovery

Result/display failures preserve the source/options snapshot and provide a recovery path.

---

## ERR-013 — Stale Response

Stale asynchronous responses do not produce false errors or overwrite active state.

---

## ERR-014 — Duplicate Actions

Duplicate clicks/taps do not create duplicate active generation requests.

---

## ERR-015 — Unknown Errors

Unexpected exceptions are safely normalized and do not cause a blank visualizer.

---

## ERR-016 — Error Boundary

Feature-level runtime failures have a safe fallback where the existing framework supports it.

---

## ERR-017 — No Sensitive Logging

Secrets and sensitive content are not exposed through normal error messages or logs.

---

## ERR-018 — Accessibility

Errors and recovery actions are accessible.

---

## ERR-019 — Mobile

Error states and recovery actions work on mobile.

---

## ERR-020 — No Automatic Retry

The application does not automatically repeat failed AI requests.

---

## ERR-021 — Recovery State Integrity

No contradictory state combinations are allowed.

---

## ERR-022 — Scope Discipline

No unrelated product features are added.

---

# 66. Definition of Done

Phase 7 is complete only when:

- [ ] Error categories are defined.
- [ ] Stable internal error codes exist.
- [ ] User-facing messages are separated from technical errors.
- [ ] Upload errors recover safely.
- [ ] Validation errors recover safely.
- [ ] Generation errors recover safely.
- [ ] Timeout errors recover safely.
- [ ] Result errors recover safely.
- [ ] Network failures stop loading.
- [ ] Unknown errors are normalized.
- [ ] Runtime failures have a safe fallback where applicable.
- [ ] Valid state is preserved.
- [ ] Duplicate actions are protected.
- [ ] Stale responses are ignored safely.
- [ ] No false success is possible.
- [ ] No operation can remain indefinitely stuck in loading.
- [ ] Recovery actions are appropriate to each error.
- [ ] Accessibility is verified.
- [ ] Mobile behavior is verified.
- [ ] Sensitive information is not exposed.
- [ ] Tests cover all critical failure paths.
- [ ] Existing Phase 1–6 behavior remains intact.
- [ ] All acceptance criteria pass.
- [ ] No out-of-scope features were implemented.

---

# 67. Agent Implementation Rules for This Phase

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read `01-PHASE-UPLOAD.md`.
4. Read `02-PHASE-OPTIONS.md`.
5. Read `03-PHASE-VALIDATION.md`.
6. Read `04-PHASE-GENERATE.md`.
7. Read `05-PHASE-RESULT.md`.
8. Read `06-PHASE-RETRY.md`.
9. Read this file completely before coding.
10. Inspect the current state/error architecture first.
11. Reuse existing error handling where safe.
12. Do not introduce a second unrelated error system.
13. Do not hide expected failures.
14. Do not expose raw exceptions to users.
15. Do not clear valid state unnecessarily.
16. Do not add automatic retries.
17. Do not add Save, Share, Download, CRM, Analytics, Auth, Estimate, Chat, or Payment.
18. Do not connect a real AI provider.
19. Do not invent error causes.
20. Preserve request/attempt identity.
21. Protect against stale async updates.
22. Ensure every async operation has a terminal state.
23. Test recovery, not only failure detection.
24. Report conflicts and ambiguities before inventing behavior.
25. Keep changes minimal.
26. Do not mark the phase complete without verification.

---

# 68. Completion Report

When implementation is complete, the coding agent must report:

```text
PHASE:
07 — Error Recovery

ERROR SYSTEM:
- ...

ERROR CATEGORIES:
- ...

RECOVERY FLOWS:
- ...

STATE PRESERVATION:
- ...

STALE / DUPLICATE PROTECTION:
- ...

ERROR BOUNDARY:
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

If an error path could not be made recoverable, explain:

```text
CAUSE
+
CURRENT BEHAVIOR
+
SAFE USER FALLBACK
```

---

# 69. Phase Exit Condition

Phase 7 exits successfully when the visualizer can handle expected failures without losing valid user state or entering ambiguous UI states.

The required behavior is:

```text
ANY EXPECTED FAILURE
        ↓
CLASSIFIED ERROR
        ↓
CLEAR USER FEEDBACK
        ↓
VALID STATE PRESERVED
        ↓
APPROPRIATE RECOVERY
```

The complete core loop should now behave as:

```text
UPLOAD
  ↓
OPTIONS
  ↓
VALIDATION
  ↓
GENERATE
  ↓
RESULT
  ↓
RETRY
  ↓
ERROR RECOVERY
  ↓
SAFE RETURN TO VALID STATE
```

The system is ready for the next hardening phase after error recovery is implemented and verified.

**Phase 7 does not implement real AI-provider integration or unrelated product features.**
