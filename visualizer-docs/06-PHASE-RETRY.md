# 06 — PHASE: RETRY

## 1. Phase Purpose

This phase defines the **Retry workflow** for the Peoria Hardwood Floors Visualizer.

The goal is to let the user safely generate another visualization using the existing source image and configuration, without rebuilding the entire visualizer flow.

The core behavior is:

```text
RESULT / ERROR
      ↓
RETRY
      ↓
REUSE VALID GENERATION SNAPSHOT
      ↓
VALIDATE
      ↓
NEW GENERATION ATTEMPT
      ↓
NEW RESULT
```

Retry must create a **new generation attempt**.

It must never reuse an old generation request ID as if it were a new request.

---

# 2. Scope

## 2.1 In Scope

This phase covers:

- Retry action.
- Retry eligibility.
- Reusing the correct source image.
- Reusing the correct validated option snapshot.
- Creating a new request/attempt identity.
- Revalidation before retry.
- Retry state transitions.
- Preventing duplicate retries.
- Protecting against stale results.
- Reusing the existing Generate workflow.
- Retry after generation error.
- Retry after timeout.
- Retry after result/display error where appropriate.
- Retry after a successful result when explicitly requested by the existing UI flow.
- Preserving user input.
- Error recovery.
- Mock-provider retry testing.
- Retry-related accessibility and mobile behavior.

## 2.2 Out of Scope

Do NOT implement in this phase:

- AI provider changes.
- Prompt refinement.
- Automatic prompt variation.
- Randomized visual changes.
- Save.
- Share.
- Download.
- CRM.
- Estimate integration.
- Analytics.
- Authentication.
- Payment.
- Chat refinement.
- New visualizer options.
- Automatic background retries.
- Infinite retry loops.
- Provider-specific retry algorithms.
- Queue infrastructure unless already required by the existing architecture.

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
AGENT-INSTRUCTIONS.md
```

The expected workflow becomes:

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
  ↓
Validation
  ↓
Generate
  ↓
New Result
```

---

# 4. Core Principle

Retry is **not** a browser refresh.

Retry is **not** a second click on the same active generation request.

Retry is a new generation attempt created from a valid snapshot.

Therefore:

```text
Old Attempt
   ↓
Retry
   ↓
New Attempt ID
```

The new attempt must be independently traceable.

---

# 5. Retry Philosophy

The V1 retry action should primarily answer:

> “Generate this visualization again using the same source image and the same selected configuration.”

It should not silently change:

- room type
- project type
- style
- wood species
- floor direction
- finish
- sheen
- service city
- square footage

unless the user explicitly changes those values first.

---

# 6. Retry State Machine

Recommended conceptual states:

```text
RESULT_READY
     ↓
RETRY_REQUESTED
     ↓
REVALIDATING
     ↓
RETRY_CREATING_REQUEST
     ↓
RETRY_GENERATING
     ↓
RETRY_SUCCESS
```

Failure paths:

```text
REVALIDATING
     ↓
RETRY_VALIDATION_ERROR

RETRY_CREATING_REQUEST
     ↓
RETRY_ERROR

RETRY_GENERATING
     ↓
RETRY_ERROR

RETRY_GENERATING
     ↓
RETRY_TIMEOUT
```

The implementation may reuse the main generation states instead of creating separate duplicate state names.

A valid architecture is:

```text
Retry action
    ↓
Generate workflow
```

rather than maintaining a completely separate generation system.

---

# 7. Important Architectural Rule

Retry must reuse the existing Phase 4 generation pipeline.

Preferred:

```text
Retry
  ↓
Build/retrieve valid snapshot
  ↓
validateVisualizerInput(snapshot)
  ↓
buildVisualizationRequest(snapshot)
  ↓
generationService.generate(...)
```

Avoid:

```text
Retry
  ↓
custom provider call
```

because that creates a second generation architecture that can drift from the primary Generate flow.

---

# 8. Retry Source of Truth

Retry should use the validated snapshot associated with the generation attempt/result.

Recommended stored data:

```js
{
  sourceSnapshot: {...},
  optionsSnapshot: {...},
  requestId: "viz_previous",
  result: {...}
}
```

The retry action creates a new request from:

```text
sourceSnapshot
+
optionsSnapshot
```

It does NOT clone:

```text
previous requestId
```

---

# 9. New Request Identity

Every retry must generate a new request ID.

Example:

```text
Original:
viz_A

Retry:
viz_B
```

Never:

```text
Retry:
viz_A
```

because the system then cannot reliably distinguish the attempts.

---

# 10. Attempt Number

An attempt counter may be maintained.

Example:

```js
attempt: 1
```

then:

```js
attempt: 2
```

then:

```js
attempt: 3
```

This is useful for debugging and analytics later.

However, the attempt number must not be treated as the sole unique identifier.

Use:

```text
requestId
```

as the primary identity.

---

# 11. Retry Eligibility

Retry should be available only when a valid retry snapshot exists.

Minimum requirements:

```text
source image exists
+
options snapshot exists
+
snapshot is structurally valid
```

If those conditions cannot be met:

```text
Retry unavailable
```

Do not attempt a best-effort retry using incomplete state.

---

# 12. Retry After Generation Error

Scenario:

```text
Generate
   ↓
Provider error
```

Retry should:

1. Preserve the original source image.
2. Preserve the validated options.
3. Create a new request ID.
4. Revalidate.
5. Start a fresh generation attempt.

Expected:

```text
ERROR
 ↓
Retry
 ↓
VALIDATION
 ↓
GENERATING
```

---

# 13. Retry After Timeout

Scenario:

```text
Generate
   ↓
Timeout
```

Retry behavior:

```text
TIMEOUT
 ↓
Retry
 ↓
New request
```

The client must not assume the timed-out server-side/provider attempt was necessarily canceled.

Therefore the new request must receive a completely new attempt identity.

---

# 14. Retry After Result Error

Scenario:

```text
Provider success
 ↓
Result validation/display error
```

Retry may use the same original source/options snapshot.

Expected:

```text
RESULT_ERROR
 ↓
Retry
 ↓
New generation attempt
```

The old invalid result must not be treated as the new result.

---

# 15. Retry After Successful Result

A retry action may be exposed after a successful result if the product flow requires it.

Its semantics remain:

```text
Same source
+
same configuration
+
new generation attempt
```

It should NOT imply:

```text
randomized prompt
```

unless explicitly implemented in a future product requirement.

---

# 16. Retry vs Edit

These are different actions.

### Retry

```text
Same source
+
same configuration
+
new generation
```

### Edit/New Configuration

```text
User changes configuration
+
new generation
```

Do not silently change options when Retry is clicked.

---

# 17. Retry Snapshot Integrity

The stored retry snapshot must represent the exact input used for the previous generation attempt.

Example:

```text
User selected:
Oak + Satin
       ↓
Generate
       ↓
Attempt A
```

Then user changes the current UI to:

```text
Maple + Matte
```

If they later click Retry for Attempt A, the Retry behavior must be explicitly defined.

Recommended V1 rule:

> Retry uses the active/current validated configuration only if the UI clearly treats the current configuration as the retry source; otherwise it must use the generation snapshot associated with the result/error.

The implementation must not guess.

If the existing UI has both:

- editable current options, and
- a Retry action,

the agent must inspect the current architecture and report any ambiguity before implementation.

---

# 18. Recommended V1 Simplicity

To minimize ambiguity, the preferred V1 behavior is:

```text
While viewing a result/error:
Retry uses the exact snapshot that produced that result/error.
```

If the user changes options intentionally, that becomes a new Generate flow rather than a Retry of the previous attempt.

This keeps Retry deterministic.

---

# 19. Snapshot Immutability

When a generation attempt starts:

```text
request snapshot
```

should be immutable.

Retry reads from that snapshot.

Do not mutate historical attempt data when the current UI changes.

---

# 20. Retry Validation

Retry must still pass through the final validator.

Do not assume:

```text
previously valid
=
still valid
```

Possible reasons state may have become invalid:

- application state changed
- service-area configuration changed
- persisted data was modified
- source file/reference expired
- application state was partially restored

Therefore:

```text
Retry
 ↓
validate snapshot
```

must remain mandatory.

---

# 21. Missing Snapshot Handling

If the application reaches a state where Retry is requested but no valid snapshot exists:

Expected:

```text
Retry unavailable / retry error
```

Do not reconstruct the snapshot from incomplete UI state without a defined rule.

User-facing message:

```text
We couldn't retry this visualization. Please start a new visualization.
```

Do not expose internal implementation details.

---

# 22. Source Image During Retry

The retry source must be the original source image associated with the attempt.

Do not automatically use the generated result as the new source image.

Correct:

```text
Original Room Photo
   ↓
Retry
   ↓
Original Room Photo
```

Not:

```text
Generated Result
   ↓
Retry
```

unless a separate future feature explicitly defines iterative image editing.

---

# 23. Object URL / File Lifetime

A browser `File` or object URL may not remain available forever in the same form.

If the retry architecture depends on an in-memory `File` object:

- verify that the reference is still usable.
- handle expired/released object URLs.
- do not assume a temporary object URL is permanent.

If the original source cannot be reused:

```text
Retry unavailable
```

or a future re-upload path may be presented.

Do not silently use another image.

---

# 24. Retry Button State

The Retry control must have explicit states.

Possible:

```text
AVAILABLE
DISABLED
RETRYING
ERROR
```

While retry is running:

```text
Retrying…
```

should not permit duplicate retry requests.

---

# 25. Duplicate Retry Protection

Scenario:

```text
User taps Retry three times quickly.
```

Expected:

```text
1 new attempt
```

not:

```text
3 new attempts
```

Use the same generation locking/guard strategy established in Phase 4.

---

# 26. Retry Must Reuse Generation Lock

Do not build a separate retry lock if the existing generation controller can safely handle both Generate and Retry.

Preferred:

```text
Generate
   ↓
Generation Controller
   ↑
Retry
```

Both flows enter the same request-protection mechanism.

---

# 27. Stale Retry Result Protection

Scenario:

```text
Retry A starts
Retry B starts later
A completes after B
```

The active attempt must win.

Use:

```text
requestId
```

or an equivalent active-attempt token to protect state.

Old retry results must not overwrite newer results.

---

# 28. Previous Result Handling

When Retry begins from a successful result:

Recommended:

```text
Result A
   ↓
Retry begins
   ↓
A becomes inactive
   ↓
Loading/new generation state
   ↓
Result B
```

Do not continue presenting Result A as though it is still the current final result while simultaneously claiming a new result is being created.

The UI may choose to:

- hide Result A during generation, or
- visually mark it as previous while the new attempt is running.

The exact presentation is UI architecture.

The state model must remain unambiguous.

---

# 29. Previous Error Handling

When Retry begins from an error state:

```text
Old error
   ↓
Retry
```

the old error should not remain as though it applies to the new request.

Clear or replace the old generation error when the new attempt starts.

---

# 30. Retry Success

When retry succeeds:

```text
new request ID
+
valid result
```

becomes the active result.

The previous result/error should no longer be considered the active generation state.

---

# 31. Retry Failure

If retry fails:

```text
new attempt
   ↓
ERROR
```

The user should see an actionable error while the snapshot remains intact for another retry attempt.

The system should not permanently disable Retry after one failure.

---

# 32. Retry Timeout

If retry times out:

```text
RETRY_GENERATING
      ↓
RETRY_TIMEOUT
```

The user must receive a clear message.

The retry snapshot should remain available for a future retry.

---

# 33. Retry Count

Do not impose an arbitrary low retry limit in V1 unless there is a clear product or provider requirement.

However, the architecture should retain an attempt counter so that future limits can be added without redesigning the workflow.

---

# 34. Infinite Retry Loop Prevention

Do not implement automatic retries.

The user must explicitly request another retry.

Bad:

```text
failure
 ↓
automatic retry
 ↓
failure
 ↓
automatic retry
```

This can generate uncontrolled provider usage later.

Correct:

```text
failure
 ↓
show Retry
 ↓
user chooses Retry
```

---

# 35. Provider Cost Safety

This is especially important because a future real AI provider may charge per generation.

Retry must never trigger:

- hidden duplicate calls
- automatic retry loops
- background retry
- duplicate requests caused by UI re-rendering

One explicit Retry action should create at most one new generation attempt.

---

# 36. Mock Provider Testing

The Phase 4 mock provider should be reused.

Test:

```text
Retry → Mock Success
Retry → Mock Error
Retry → Mock Timeout
```

Do not create a second fake provider specifically for Retry.

---

# 37. Retry Request Builder

The Retry implementation should ideally build its request through the same request builder used by Generate.

Conceptually:

```js
const request = buildVisualizationRequest(snapshot);
```

Then:

```js
generationService.generate(request);
```

This prevents request-shape divergence.

---

# 38. Retry and Validation Contract

The final path must be:

```text
Retry
 ↓
Retrieve snapshot
 ↓
Validate
 ↓
Build request
 ↓
Create new requestId
 ↓
Generate
```

Do not generate directly from a stored raw provider payload.

The snapshot represents user intent.

The request builder represents current application contract.

---

# 39. Retry and Provider Abstraction

Retry must remain provider-agnostic.

Correct:

```text
Retry
 ↓
Generation Service
 ↓
Provider abstraction
```

Not:

```text
Retry
 ↓
Specific AI Vendor API
```

---

# 40. Retry Result Contract

Retry must produce exactly the same normalized Result contract used by normal Generate.

Example:

```js
{
  requestId: "viz_retry_123",
  status: "success",
  result: {
    imageUrl: "..."
  }
}
```

The Result phase should not need to know whether a result came from:

```text
Generate
```

or:

```text
Retry
```

---

# 41. No Special Result UI Path

Avoid:

```text
if (isRetryResult) { ... }
```

inside the Result component unless the product has a real user-facing requirement.

The result is a result.

The generation attempt metadata may record that it originated from Retry.

---

# 42. Retry Metadata

Optional normalized metadata:

```js
{
  attemptNumber: 2,
  retryOfRequestId: "viz_A"
}
```

This can help debugging and future analytics.

These fields should not be required by the Result UI.

---

# 43. Retry and Analytics

Analytics are out of scope.

However, do not prevent future instrumentation.

Useful metadata can be retained internally:

```text
attemptNumber
retryOfRequestId
```

Do not add analytics tracking events in this phase.

---

# 44. Retry and Accessibility

The Retry action must:

- be keyboard accessible.
- have an accessible name.
- expose disabled/loading state appropriately.
- announce meaningful status changes.
- not create unexpected focus jumps.
- remain operable with assistive technology.

Example accessible name:

```text
Retry visualization
```

Not merely:

```text
Retry
```

if context could be ambiguous.

---

# 45. Retry and Mobile

On mobile:

- Retry must be easy to tap.
- duplicate rapid taps must be ignored.
- loading state must be visible.
- the result/error state must remain understandable.
- no horizontal overflow should be introduced.

---

# 46. Focus Management

After Retry is activated:

- move or preserve focus logically.
- do not trap focus inside the loading state.
- when the new result arrives, focus behavior should remain predictable.

Avoid unnecessary automatic scrolling unless the existing UX requires it.

---

# 47. Error Messaging

Recommended Retry failure message:

```text
We couldn't generate another visualization right now. Please try again.
```

Recommended missing-snapshot message:

```text
We couldn't retry this visualization. Please start a new visualization.
```

Do not expose technical error details.

---

# 48. Retry and Current Form State

Recommended V1 rule:

```text
Retry uses the saved generation snapshot.
```

Current unsaved edits should not silently replace the Retry snapshot.

For example:

```text
Attempt A:
Oak + Satin

User later changes current form:
Maple + Matte

Retry Attempt A
```

Expected:

```text
Oak + Satin
```

provided the UI is explicitly invoking Retry for Attempt A.

This rule prevents a Retry button from producing a request that differs from the user's previously generated result without them knowing.

---

# 49. New Generate After Editing

If the user intentionally changes options:

```text
Oak → Maple
```

then the correct conceptual action is:

```text
Generate
```

not:

```text
Retry
```

The product should keep these semantics separate.

---

# 50. Retry State Lifetime

Retry-related snapshot state only needs to survive as long as the current visualizer session requires.

Do not implement long-term persistence in this phase.

If the page is fully refreshed and the snapshot disappears, that is acceptable unless the existing architecture already provides persistence.

---

# 51. Security

Retry must not expose:

- API keys
- provider credentials
- internal file paths
- private backend payloads

A retry request should contain only the normalized data needed by the generation service.

---

# 52. Privacy

Do not duplicate or persist source image data unnecessarily.

Retry should reuse the existing validated source reference where possible.

Do not create extra copies of uploaded images just to implement retry.

---

# 53. Performance

Retry should avoid unnecessary preprocessing.

Do not:

- re-encode the source image multiple times without need.
- duplicate large image blobs.
- recreate option definitions.
- rerender the entire application unnecessarily.

The new request should be generated from the existing normalized snapshot.

---

# 54. Test Scenarios

The implementation must test at least the following.

## RET-TEST-001 — Retry After Success

```text
Generate
→ Success
→ Retry
```

Expected:

```text
new request ID
new generation attempt
```

---

## RET-TEST-002 — Retry After Error

```text
Generate
→ Error
→ Retry
```

Expected:

```text
new request
```

---

## RET-TEST-003 — Retry After Timeout

```text
Generate
→ Timeout
→ Retry
```

Expected:

```text
new request
```

---

## RET-TEST-004 — Retry After Result Error

```text
Generate
→ Provider success
→ Result display error
→ Retry
```

Expected:

```text
new generation request
```

---

## RET-TEST-005 — New Request ID

Original:

```text
viz_A
```

Retry:

```text
viz_B
```

Expected:

```text
viz_A !== viz_B
```

---

## RET-TEST-006 — Same Source Snapshot

Expected:

```text
Retry source === original attempt source
```

unless the source has become invalid/unavailable.

---

## RET-TEST-007 — Same Options Snapshot

Expected:

```text
Retry options === original attempt options
```

for the specific retry target.

---

## RET-TEST-008 — Current UI Changes Do Not Corrupt Historical Retry

Change current UI after Attempt A.

Retry Attempt A.

Expected:

```text
Attempt A snapshot remains unchanged
```

---

## RET-TEST-009 — Duplicate Retry

Rapidly activate Retry multiple times.

Expected:

```text
one new generation request
```

---

## RET-TEST-010 — Retry Validation Failure

Make the stored retry snapshot invalid.

Expected:

```text
no provider call
clear retry validation error
```

---

## RET-TEST-011 — Retry Mock Error

Expected:

```text
retry attempt → ERROR
```

Snapshot remains available.

---

## RET-TEST-012 — Retry Mock Timeout

Expected:

```text
retry attempt → TIMEOUT
```

---

## RET-TEST-013 — Stale Retry Result

Attempt A completes after Attempt B.

Expected:

```text
A cannot overwrite B
```

---

## RET-TEST-014 — Successful Retry Replacement

Result A exists.

Retry produces Result B.

Expected:

```text
Result B active
Result A inactive
```

---

## RET-TEST-015 — Recovery

Retry fails.

User clicks Retry again.

Expected:

```text
new attempt starts normally
```

---

## RET-TEST-016 — Mobile Retry

Verify retry flow on a small viewport.

Expected:

```text
usable
no overflow
no duplicate action
```

---

## RET-TEST-017 — Accessibility

Verify:

- Retry accessible name
- keyboard activation
- loading announcement
- error announcement
- disabled state

---

# 55. Acceptance Criteria

## RET-001 — Explicit Retry

Retry is an explicit user action.

---

## RET-002 — New Attempt

Every Retry creates a new generation attempt.

---

## RET-003 — New Request ID

Every Retry gets a unique request ID.

---

## RET-004 — Snapshot Reuse

Retry uses the correct source/options snapshot.

---

## RET-005 — Revalidation

Retry passes through final validation again.

---

## RET-006 — Shared Generation Pipeline

Retry uses the existing generation service/provider architecture.

---

## RET-007 — Duplicate Protection

Rapid Retry activations do not create duplicate generation requests.

---

## RET-008 — Stale Protection

Old retry responses cannot overwrite newer active results.

---

## RET-009 — Error Recovery

Retry works after generation errors.

---

## RET-010 — Timeout Recovery

Retry works after timeout states.

---

## RET-011 — Result Error Recovery

Retry can recover from result/display errors where a valid source/options snapshot remains.

---

## RET-012 — Input Preservation

Retry does not destroy the original source/options snapshot.

---

## RET-013 — No Automatic Retry

The system does not retry automatically.

---

## RET-014 — No Fake Success

Retry only reaches success after a valid generation result is received.

---

## RET-015 — Provider Independence

Retry is independent of a specific AI provider.

---

## RET-016 — Mock Provider

Retry works with the Phase 4 mock provider.

---

## RET-017 — Cost Safety

One explicit Retry action does not silently create multiple provider requests.

---

## RET-018 — Accessibility

Retry works for keyboard and assistive-technology users.

---

## RET-019 — Mobile

Retry is usable on mobile.

---

## RET-020 — No Scope Creep

No Save, Share, Download, CRM, Analytics, Auth, Estimate, Chat, or payment functionality is added.

---

# 56. Definition of Done

Phase 6 is complete only when:

- [ ] Retry exists as an explicit action.
- [ ] Retry creates a new generation attempt.
- [ ] New request ID is created.
- [ ] Correct source snapshot is reused.
- [ ] Correct option snapshot is reused.
- [ ] Retry passes through final validation.
- [ ] Retry uses the existing generation service.
- [ ] Duplicate retry requests are prevented.
- [ ] Stale results are protected against.
- [ ] Retry works after generation error.
- [ ] Retry works after timeout.
- [ ] Retry works after result/display error where applicable.
- [ ] Previous state is preserved correctly.
- [ ] Automatic retry does not exist.
- [ ] Retry is provider-agnostic.
- [ ] Mock provider tests pass.
- [ ] Accessibility is verified.
- [ ] Mobile behavior is verified.
- [ ] No unnecessary image duplication exists.
- [ ] Existing Phase 1–5 behavior remains intact.
- [ ] All acceptance criteria pass.
- [ ] No out-of-scope features were implemented.

---

# 57. Agent Implementation Rules for This Phase

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read `01-PHASE-UPLOAD.md`.
4. Read `02-PHASE-OPTIONS.md`.
5. Read `03-PHASE-VALIDATION.md`.
6. Read `04-PHASE-GENERATE.md`.
7. Read `05-PHASE-RESULT.md`.
8. Read this file completely before coding.
9. Inspect the current Generate and Result implementation.
10. Reuse the Phase 4 generation pipeline.
11. Reuse the Phase 5 normalized Result contract.
12. Do not create a second provider system.
13. Do not call a real AI provider.
14. Do not implement automatic retries.
15. Do not create retry loops.
16. Do not silently modify the retry snapshot.
17. Generate a new request ID for every retry.
18. Revalidate the retry snapshot.
19. Preserve source/options data.
20. Protect against stale async results.
21. Prevent duplicate Retry actions.
22. Do not add Save, Share, Download, CRM, Analytics, Auth, Estimate, Chat, or Payment.
23. Do not add provider-specific retry logic.
24. Do not invent behavior where current UI semantics are ambiguous.
25. Report any conflict between current implementation and this specification.
26. Test both success and failure paths.
27. Do not mark the phase complete without verification.

---

# 58. Completion Report

When implementation is complete, the coding agent must report:

```text
PHASE:
06 — Retry

IMPLEMENTED:
- ...

RETRY SOURCE:
- ...

REQUEST ID / ATTEMPT:
- ...

VALIDATION:
- ...

GENERATION PIPELINE:
- ...

ERROR / TIMEOUT RECOVERY:
- ...

STALE RESPONSE PROTECTION:
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

If retry had to be disabled for a specific reason, explain the exact missing dependency or ambiguity.

---

# 59. Phase Exit Condition

Phase 6 exits successfully when the core loop supports:

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
  ↓
New Validation
  ↓
New Generation Attempt
  ↓
New Result
```

with these guarantees:

```text
Retry ≠ duplicate request
Retry ≠ old request ID
Retry ≠ automatic retry
Retry ≠ random configuration change
```

The final core behavior is:

```text
USER ACTION
    ↓
VALID SNAPSHOT
    ↓
NEW REQUEST ID
    ↓
GENERATION
    ↓
VALID RESULT
    ↓
ACTIVE RESULT
```

The visualizer core loop is now functionally complete enough for the next hardening phase.

**Phase 6 does not implement AI-provider-specific retry policies.**
