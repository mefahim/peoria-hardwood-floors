# 08 — PHASE: TESTING

## 1. Phase Purpose

This phase defines the **testing strategy and implementation requirements** for the Peoria Hardwood Floors Visualizer core workflow.

The objective is to verify that the visualizer is not merely functional in the happy path, but remains reliable when users:

- upload different image types,
- provide incomplete or invalid input,
- generate a visualization,
- encounter network/provider failures,
- retry,
- receive delayed responses,
- replace input,
- use mobile devices,
- repeat the workflow many times.

The core acceptance goal is:

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
```

must behave predictably across both successful and failure scenarios.

Testing must verify **behavior**, not only code coverage.

---

# 2. Scope

## 2.1 In Scope

This phase covers:

- Testing strategy.
- Unit testing.
- Component testing.
- Integration testing.
- End-to-end testing.
- State-machine testing.
- Validation testing.
- Upload testing.
- Generation testing.
- Result testing.
- Retry testing.
- Error-recovery testing.
- Async/concurrency testing.
- Stale-response testing.
- Duplicate-action testing.
- Accessibility testing.
- Responsive/mobile functional testing.
- Browser testing.
- Mock-provider testing.
- API/service boundary testing where applicable.
- Regression testing.
- Test fixtures and deterministic test data.
- Test failure classification.
- Acceptance criteria for release readiness.
- Definition of Done for the testing phase.

## 2.2 Out of Scope

Do NOT implement in this phase:

- New product functionality.
- New visualizer options.
- Real AI-provider integration.
- Production prompt optimization.
- Save/Share/Download/CRM/Analytics.
- Payment.
- Authentication.
- New backend infrastructure unless required to make existing functionality testable.
- Large-scale performance/load-testing infrastructure.
- Third-party monitoring platform setup unless already present.

Testing may reveal implementation defects from earlier phases. Fix those defects only when they are directly required to satisfy the documented core workflow.

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
07-PHASE-ERROR-RECOVERY.md
AGENT-INSTRUCTIONS.md
```

The tester/coding agent must read all of these before deciding that the visualizer is production-ready.

---

# 4. Testing Philosophy

The visualizer must be tested at multiple levels.

```text
Unit
  ↓
Component
  ↓
Integration
  ↓
End-to-End
  ↓
Manual/Device QA
```

No single test type is sufficient.

Example:

```text
Unit test:
validator correctly rejects invalid value
```

does not prove:

```text
Generate button blocks the actual UI flow.
```

Likewise:

```text
E2E test:
happy path works
```

does not prove:

```text
every validation rule is deterministic.
```

---

# 5. Testing Priorities

Testing priority should follow the core user journey.

### Priority 1 — Core Reliability

```text
Upload
→ Validation
→ Generate
→ Result
→ Retry
```

### Priority 2 — Failure Recovery

```text
invalid input
provider error
timeout
network failure
result failure
```

### Priority 3 — State Integrity

```text
duplicate click
stale response
input preservation
request identity
```

### Priority 4 — Accessibility and Mobile

```text
keyboard
screen reader
small viewport
touch interaction
```

### Priority 5 — Regression

```text
existing site functionality
unrelated site functionality
```

---

# 6. Test Environment

Tests must run in an environment that reflects the actual application architecture as closely as practical.

Minimum environments:

```text
Local development
CI/test environment, where configured
```

For browser testing, include:

```text
Desktop
Mobile-sized viewport
```

Real device testing should be used where practical for critical mobile interactions.

---

# 7. Test Data Principles

Test data must be:

- deterministic
- safe
- reusable
- easy to understand
- version-controlled where practical

Do not use real customer images or sensitive personal data in automated tests.

Use dedicated synthetic/test images.

---

# 8. Test Image Fixtures

Maintain a small controlled fixture set.

Recommended examples:

```text
valid-landscape.jpg
valid-portrait.jpg
valid-square.png
valid-webp.webp
too-large.jpg
too-small.jpg
corrupt-image.jpg
unsupported-file.gif
```

The exact fixture files depend on the implementation.

Fixtures should test:

- supported formats
- dimensions
- size limits
- EXIF/orientation handling if relevant
- malformed files

---

# 9. Test Configuration

Tests should not depend on production AI credentials.

Use:

```text
Mock Provider
```

for generation tests.

Real provider testing must be a separate explicitly controlled integration environment later.

Never put production API keys in source control.

---

# 10. Test Architecture

Recommended conceptual test structure:

```text
tests/
├── unit/
│   ├── validation/
│   ├── request-builder/
│   ├── error-normalization/
│   └── state/
│
├── integration/
│   ├── upload/
│   ├── generation/
│   ├── result/
│   ├── retry/
│   └── error-recovery/
│
└── e2e/
    ├── happy-path/
    ├── validation/
    ├── errors/
    ├── retry/
    └── mobile/
```

This is illustrative.

Follow the existing repository/test conventions instead of creating duplicate infrastructure.

---

# 11. Testing Layers

## 11.1 Unit Tests

Test isolated logic such as:

- validators
- normalizers
- request builders
- error normalization
- state transitions
- option definitions
- retry snapshot handling

---

## 11.2 Component Tests

Test UI behavior such as:

- upload component
- option controls
- validation messages
- Generate control
- loading state
- result display
- Retry control
- error states

---

## 11.3 Integration Tests

Test interactions between layers:

```text
UI
 ↓
validation
 ↓
request builder
 ↓
generation service
 ↓
mock provider
 ↓
result state
```

---

## 11.4 End-to-End Tests

Test the user journey from the browser's perspective.

Example:

```text
Upload image
→ select options
→ Generate
→ see result
→ Retry
→ see new result
```

---

# 12. Unit Testing — Upload

Minimum upload unit-test cases:

### UP-T-001

Valid JPEG accepted.

### UP-T-002

Valid PNG accepted.

### UP-T-003

Valid WebP accepted.

### UP-T-004

Unsupported type rejected.

### UP-T-005

Oversized file rejected.

### UP-T-006

Too-small image rejected.

### UP-T-007

Corrupt image rejected.

### UP-T-008

File picker cancellation does not create an error.

### UP-T-009

Valid existing image survives invalid replacement.

### UP-T-010

Same file can be selected again after replacement/reset.

### UP-T-011

Image metadata is normalized correctly.

### UP-T-012

Portrait image accepted when otherwise valid.

### UP-T-013

Landscape image accepted when otherwise valid.

---

# 13. Unit Testing — Options

Each option must be tested against its canonical values.

Minimum:

```text
roomType
projectType
preferredStyle
woodSpecies
floorDirection
finishPreference
sheen
serviceCity
squareFootage
```

Tests must verify:

- valid values accepted
- invalid values rejected
- null behavior
- `unsure` behavior where supported
- stable internal values
- normalization behavior

---

# 14. Unit Testing — Conditional Custom Style

Required cases:

```text
preferredStyle = custom
customStyleDescription = valid
```

→ valid.

```text
preferredStyle = custom
customStyleDescription = ""
```

→ invalid.

```text
preferredStyle = custom
customStyleDescription = whitespace
```

→ invalid.

```text
preferredStyle != custom
customStyleDescription = ""
```

→ valid unless another product rule says otherwise.

Overlong descriptions must be rejected according to the configured limit.

---

# 15. Unit Testing — Square Footage

Minimum cases:

```text
null
""
"1200"
" 1200 "
1200
0
-100
"abc"
NaN
Infinity
-Infinity
```

Expected behavior must exactly match Phase 3.

Do not permit inconsistent normalization between UI and validator.

---

# 16. Unit Testing — Validation

The canonical validator must be tested independently.

Minimum scenarios:

### VAL-T-001

Complete valid state → `valid: true`.

### VAL-T-002

Missing image → invalid.

### VAL-T-003

Missing required field → invalid.

### VAL-T-004

Invalid controlled value → invalid.

### VAL-T-005

Valid `unsure` value → valid.

### VAL-T-006

Custom style without description → invalid.

### VAL-T-007

Invalid square footage → invalid.

### VAL-T-008

Multiple invalid fields → all relevant errors returned.

### VAL-T-009

Malformed state → structured validation failure, no crash.

### VAL-T-010

Corrected state → validation passes.

---

# 17. Validation Invariants

The following must always be true:

```text
invalid state
    ↓
valid === false
```

and:

```text
all required valid conditions
    +
valid supplied optional values
    ↓
valid === true
```

Also:

```text
unsure
```

must not be interpreted as:

```text
missing
```

where `unsure` is an allowed value.

---

# 18. Unit Testing — Request Builder

Test that the request builder:

- accepts only validated state
- creates normalized request data
- excludes unnecessary UI-only fields
- uses stable internal values
- preserves source metadata
- preserves options
- creates/receives a valid request ID
- does not mutate the original form state

Example invariant:

```text
input state
    ↓
build request
    ↓
input state unchanged
```

---

# 19. Unit Testing — Error Normalization

Test:

```text
Error instance
string
object
null
undefined
network error
timeout error
provider error
validation error
```

All must normalize to a safe internal error shape.

No normal user-facing output should expose raw exception details.

---

# 20. Unit Testing — State Machine

Test every important transition.

Example:

```text
IDLE → VALIDATING
```

valid.

```text
VALIDATING → GENERATING
```

should only occur through the correct request-creation path.

```text
VALIDATING → ERROR
```

must preserve user state.

```text
GENERATING → SUCCESS
```

must require a valid result.

```text
GENERATING → ERROR
```

must stop loading.

```text
GENERATING → TIMEOUT
```

must stop loading.

Illegal transitions should be rejected or ignored safely.

---

# 21. Unit Testing — Retry

Minimum cases:

```text
retry creates new request ID
retry uses original snapshot
retry revalidates
retry does not mutate historical snapshot
retry does not automatically repeat
```

Test:

```text
request A
↓
retry
↓
request B
```

and assert:

```text
A.requestId !== B.requestId
```

---

# 22. Integration Testing — Upload

Test the actual upload interaction:

```text
choose file
↓
browser/file input
↓
validation
↓
normalized state
↓
preview
```

Verify:

- success
- invalid file
- replacement
- cancellation
- error recovery

---

# 23. Integration Testing — Options

Test that:

- each option updates state.
- unrelated options remain unchanged.
- image remains intact.
- selected values use canonical internal values.
- custom style field appears/behaves conditionally.
- square footage normalization works.

---

# 24. Integration Testing — Generate

Test:

```text
valid state
↓
Generate
↓
final validation
↓
request builder
↓
generation service
↓
mock provider
```

Verify the provider is called exactly once.

---

# 25. Integration Testing — Generate Blocking

Invalid states must not call the provider.

Examples:

```text
missing image
missing required option
invalid option
custom style missing
invalid square footage
```

Expected:

```text
provider call count = 0
```

---

# 26. Integration Testing — Mock Success

Use:

```text
MOCK_SUCCESS
```

Expected:

```text
Generate
→ Generating
→ Result ready
→ Result displayed
```

Verify request ID continuity.

---

# 27. Integration Testing — Mock Error

Use:

```text
MOCK_ERROR
```

Expected:

```text
Generate
→ Error
```

Verify:

- no stuck spinner
- input preserved
- retry remains possible
- error is user-safe

---

# 28. Integration Testing — Mock Timeout

Use:

```text
MOCK_TIMEOUT
```

Expected:

```text
Generate
→ Timeout
```

Verify:

- loading ends
- input preserved
- retry available
- no fake success

---

# 29. Integration Testing — Result

Test:

```text
provider success
↓
result normalization
↓
result state
↓
image rendering
```

Verify:

- valid image displays
- invalid image reference is rejected
- image load errors are handled

---

# 30. Integration Testing — Retry

Test:

```text
Result
↓
Retry
↓
new validation
↓
new request
↓
new mock generation
↓
new result
```

Verify:

- new request ID
- same retry snapshot
- no duplicate request
- new result becomes active

---

# 31. Integration Testing — Error Recovery

Test:

```text
upload failure
validation failure
generation failure
timeout
result error
network failure
```

For each:

```text
error
↓
appropriate recovery
↓
state remains consistent
```

---

# 32. End-to-End — Primary Happy Path

This is the most important E2E test.

```text
1. Open visualizer.
2. Upload a valid room image.
3. Select valid Room Type.
4. Select valid Project Type.
5. Select Preferred Style.
6. Select Wood Species.
7. Select Floor Direction.
8. Select Finish Preference.
9. Select Sheen.
10. Click Generate.
11. Wait for mock generation.
12. Verify result appears.
```

Expected:

```text
No validation errors
No console/runtime errors
One generation attempt
Valid result visible
```

---

# 33. End-to-End — Custom Style

Test:

```text
Preferred Style = Custom
```

Verify:

```text
custom style field becomes required
```

Then:

```text
description entered
```

Verify Generate succeeds.

---

# 34. End-to-End — Missing Required Input

Start with incomplete configuration.

Click Generate.

Verify:

```text
no provider request
field errors visible
input preserved
```

Fix fields.

Click Generate again.

Verify:

```text
generation proceeds
```

---

# 35. End-to-End — Invalid Replacement Image

Scenario:

```text
valid image
↓
replace with invalid image
```

Expected:

```text
invalid replacement rejected
existing valid image preserved
```

---

# 36. End-to-End — Generation Error

Configure:

```text
MOCK_ERROR
```

Flow:

```text
valid input
→ Generate
→ error
```

Verify:

```text
error displayed
input preserved
Retry available
```

---

# 37. End-to-End — Retry

Flow:

```text
valid input
→ Generate
→ Result
→ Retry
→ New Generate
→ New Result
```

Verify:

```text
new request ID
same source/options snapshot
no duplicate generation
```

---

# 38. End-to-End — Retry After Error

Flow:

```text
Generate
→ Error
→ Retry
→ Success
```

Verify:

```text
old error cleared
new result displayed
```

---

# 39. End-to-End — Stale Result

If the architecture allows controlled simulation:

```text
Request A starts
Request B becomes active
B completes
A completes later
```

Verify:

```text
B remains active
A does not overwrite B
```

This can be implemented with deterministic mock delays.

---

# 40. End-to-End — Double Generate

Rapidly click Generate multiple times.

Expected:

```text
one active generation request
```

Verify provider invocation count.

---

# 41. End-to-End — Double Retry

Rapidly tap/click Retry multiple times.

Expected:

```text
one retry attempt
```

---

# 42. End-to-End — Result Image Failure

Simulate an invalid/broken result image URL.

Expected:

```text
result display error
```

Verify the page does not remain blank or permanently loading.

---

# 43. End-to-End — Start New

If Start New exists in the current implementation:

```text
existing session
↓
Start New
```

Expected:

```text
visualizer reset intentionally
```

Verify this action is clearly different from error recovery.

---

# 44. Accessibility Testing

Accessibility testing must include:

- keyboard navigation
- visible focus
- semantic form controls
- labels
- field error association
- screen-reader status announcements
- button names
- disabled/loading states
- result image alternative text

Do not treat accessibility as a visual-only check.

---

# 45. Keyboard Test Flow

Complete the core path using keyboard only:

```text
Tab
→ Upload
→ options
→ Generate
→ result/retry
```

Verify:

- no inaccessible controls
- logical tab order
- visible focus
- keyboard activation works
- no focus traps

---

# 46. Screen Reader Test

Where practical, test with a supported screen reader.

Verify:

```text
field labels
required/error information
loading state
generation failure
result image
Retry control
```

The exact screen reader depends on the development/test environment.

---

# 47. Responsive Testing

At minimum test:

```text
small mobile
large mobile
tablet
desktop
```

The functional test must verify:

- upload works
- options are usable
- Generate remains accessible
- loading state is visible
- result fits viewport
- errors remain readable
- Retry remains usable

---

# 48. Real Device Testing

Where practical, test the critical mobile flow on at least one physical mobile device.

Priority:

```text
upload from device
→ configure
→ generate
→ result
→ retry
```

Pay special attention to:

- file picker behavior
- camera/file selection
- viewport resizing
- touch duplication
- keyboard appearance

---

# 49. Browser Matrix

Use the browsers supported by the project.

At minimum, where applicable:

```text
Chrome/Chromium
Safari
Firefox
```

For mobile:

```text
iOS Safari
Android Chrome
```

The exact matrix should follow the site's actual supported browser policy.

Do not claim universal browser support if it was not tested.

---

# 50. Console and Runtime Error QA

A successful test must not be considered clean if the core flow produces unexpected:

```text
console.error
uncaught exception
unhandled promise rejection
```

Expected development warnings may be acceptable only when they are understood and documented.

Do not ignore console errors simply because the page visually works.

---

# 51. Network Testing

Test simulated:

```text
normal network
slow network
request failure
server 4xx
server 5xx
temporary interruption
```

Verify:

- loading state
- timeout
- error message
- recovery
- input preservation

---

# 52. Async Testing

Async tests must cover:

- delayed provider
- delayed result image
- timeout
- stale response
- duplicate action
- cancellation if implemented

Do not test only the fastest success case.

---

# 53. Deterministic Mock Provider

The mock provider should support deterministic behavior.

Recommended modes:

```text
success
error
timeout
delayed-success
delayed-error
stale-response
```

Where practical, delay durations should be configurable.

Avoid random behavior in automated tests.

---

# 54. Test Request Counters

The mock provider should expose a safe testing mechanism to verify:

```text
number of calls
request IDs
received payload
call order
```

This should only be available to tests/development.

Production code must not expose internal test controls.

---

# 55. Test Assertions for Request Count

Examples:

### Single Generate

```text
expected calls = 1
```

### Double click

```text
expected calls = 1
```

### Generate → Retry

```text
expected calls = 2
```

### Validation failure

```text
expected calls = 0
```

### Retry after error

```text
expected calls = 2
```

---

# 56. Snapshot Integrity Tests

Verify that the request snapshot is not mutated after request creation.

Example:

```text
Generate with Oak
↓
request created
↓
UI changes to Maple
```

Expected:

```text
original request remains Oak
```

This is critical for asynchronous correctness.

---

# 57. Stale Result Tests

Use deterministic delays.

Example:

```text
Request A delay = 1000ms
Request B delay = 100ms
```

Expected:

```text
B becomes active
A ignored when it completes
```

The exact ability to start overlapping requests depends on the V1 concurrency rules. If concurrent requests are prohibited, simulate a stale callback/response instead.

---

# 58. Error Recovery Regression Tests

Every bug discovered during implementation that affects the core loop should gain a regression test.

Process:

```text
Bug found
 ↓
Fix implemented
 ↓
Regression test added
 ↓
Test becomes permanent
```

Do not repeatedly fix the same class of bug manually.

---

# 59. Test Naming

Test names should describe behavior.

Good:

```text
rejects generation when room type is missing
```

Better than:

```text
testGenerate2
```

Tests should communicate intent to future developers.

---

# 60. Test Independence

Tests should not depend on execution order.

Bad:

```text
test A creates state
test B depends on A state
```

Preferred:

```text
each test initializes its own required state
```

This reduces flaky failures.

---

# 61. Cleanup

Tests must clean up:

- temporary files
- object URLs
- mock state
- timers
- network mocks
- generated test artifacts

A test suite that passes but leaks state is not reliable.

---

# 62. Fake Timers

Where the test framework supports fake timers, use them for:

- generation delay
- timeout
- delayed mock responses

This makes async tests:

- faster
- deterministic
- less flaky

---

# 63. Flaky Test Policy

A flaky test must not simply be retried until it passes and then ignored.

If a test is flaky:

```text
identify root cause
↓
fix test/product race condition
↓
run again
```

Do not hide flaky tests.

---

# 64. Code Coverage

Coverage may be used as a supporting metric.

However:

```text
high coverage ≠ reliable product
```

Coverage should focus on important logic.

Priority coverage:

- validation
- state transitions
- generation service
- error normalization
- retry
- result handling

Do not optimize solely for a percentage.

---

# 65. Critical Path Coverage

The following must have strong automated coverage:

```text
valid generation
invalid generation
generation failure
generation timeout
result success
result error
retry success
retry failure
stale response
duplicate action
state preservation
```

---

# 66. Security Testing

Within this phase, verify at minimum:

- no API keys appear in frontend source.
- no secrets appear in test fixtures.
- arbitrary provider HTML is not injected.
- unsafe result URLs are rejected according to application policy.
- malformed input does not crash the client.
- uploaded files still pass Phase 1 validation.

Full security auditing is outside the scope of this phase.

---

# 67. Regression Testing

Before marking the phase complete, rerun earlier phase tests.

At minimum:

```text
Phase 1 upload tests
Phase 2 option tests
Phase 3 validation tests
Phase 4 generation tests
Phase 5 result tests
Phase 6 retry tests
Phase 7 error recovery tests
```

The testing phase must not introduce regressions.

---

# 68. Production Smoke Test

Before deployment, run a short smoke test using the production-like environment and mock/safe provider configuration where appropriate.

Minimum:

```text
open visualizer
upload valid image
select all required options
Generate
verify result
Retry
verify new result
trigger one controlled failure
verify recovery
```

If real AI is later integrated, a separate controlled real-provider smoke test should be run before enabling production traffic.

---

# 69. Release Blockers

The following are release blockers for the V1 core workflow:

```text
Generate can bypass validation
multiple duplicate generation requests
stuck loading state
false success
result cannot be displayed
retry reuses old request ID
stale result overwrites current result
valid input is destroyed by recoverable errors
critical keyboard path is broken
uncaught runtime error in core path
```

Any release blocker must be resolved before declaring the core loop production-ready.

---

# 70. Non-Blocking Issues

Potentially non-blocking issues include:

- minor copy improvements
- non-critical visual polish
- optional test coverage for low-risk peripheral behavior

Do not use "non-blocking" to excuse failures in the core workflow.

---

# 71. Test Result Classification

Every executed test should end in one of:

```text
PASS
FAIL
BLOCKED
NOT_RUN
```

Definitions:

### PASS

Expected behavior verified.

### FAIL

Behavior does not meet specification.

### BLOCKED

Cannot execute because of a known dependency/environment problem.

### NOT_RUN

Intentionally not executed.

Do not report `BLOCKED` as `PASS`.

---

# 72. Defect Classification

Defects should be classified by impact.

### Critical

Core workflow unusable or unsafe.

### High

Major core workflow behavior broken.

### Medium

Meaningful functionality affected but workaround exists.

### Low

Minor non-core issue.

Do not downplay critical workflow defects.

---

# 73. Test Report Requirements

The final test report should include:

```text
Environment
Browser/device
Tests executed
Pass count
Fail count
Blocked count
Known issues
Critical defects
Regression status
```

Also include the exact test command(s) used where relevant.

---

# 74. Example Test Report

```text
PHASE:
08 — Testing

ENVIRONMENT:
- Local development
- Chrome desktop
- Android Chrome mobile viewport

AUTOMATED TESTS:
- Passed: 124
- Failed: 0
- Blocked: 0

E2E:
- Happy path: PASS
- Validation: PASS
- Generation error: PASS
- Timeout: PASS
- Result error: PASS
- Retry: PASS
- Duplicate click: PASS
- Stale response: PASS

ACCESSIBILITY:
- Keyboard: PASS
- Error association: PASS
- Result alt text: PASS

REGRESSION:
- Phase 1: PASS
- Phase 2: PASS
- Phase 3: PASS
- Phase 4: PASS
- Phase 5: PASS
- Phase 6: PASS
- Phase 7: PASS

BLOCKERS:
- None
```

Do not fabricate numbers.

The actual report must reflect actual executed tests.

---

# 75. CI Requirements

If CI exists, core automated tests should run automatically on relevant changes.

At minimum:

```text
install
→ lint/type checks if configured
→ unit tests
→ integration tests
```

E2E tests may run in CI according to repository capability.

Do not add expensive CI infrastructure unless it is justified by the project.

---

# 76. Test Failure Policy

If tests fail:

```text
do not mark phase complete
```

unless the failure is explicitly documented as:

```text
known non-blocking issue
```

and that classification is justified.

Critical-path failures always block completion.

---

# 77. Linting and Type Checks

Where the project already uses:

```text
ESLint
TypeScript
Prettier
PHPStan
other repository-standard checks
```

run the appropriate existing commands.

Do not introduce new tooling just to satisfy this phase unless necessary.

---

# 78. Build Verification

The application should successfully build using the repository's normal build process.

At minimum verify:

```text
development build
production build
```

where the project supports both.

Build errors are blockers.

---

# 79. Runtime Verification

After building:

```text
start application
open visualizer
run core flow
```

Verify no runtime exceptions occur.

A successful compile does not prove runtime correctness.

---

# 80. Test Against Existing UI

Tests should reflect the actual user-facing behavior of the current implementation.

Do not alter product behavior solely to make tests easier.

If a test reveals a specification conflict:

```text
stop
document conflict
resolve specification before changing behavior
```

---

# 81. Testability Requirements

Implementation should make important logic testable without requiring:

- real AI credits
- real user accounts
- real customer data
- external production infrastructure

The architecture should therefore keep:

```text
validation
request building
generation service
provider
result normalization
```

reasonably separated.

---

# 82. No Test-Only Production Behavior

Do not add production features solely to simplify automated testing.

Bad:

```text
?testMode=true
```

as an insecure production bypass.

Test controls must be safely isolated.

---

# 83. Test Data Security

Test fixtures must not contain:

- customer personal information
- private credentials
- production API keys
- confidential images
- private URLs

Use synthetic or deliberately approved test data.

---

# 84. Testing the Error Boundary

If a feature-level error boundary exists, intentionally trigger a controlled component error in a test environment.

Verify:

```text
component failure
↓
fallback UI
↓
no blank feature
```

Do not use production user flows to intentionally crash the application.

---

# 85. Testing Recovery Without Reload

For recoverable errors, verify that the user can continue without refreshing the page.

Examples:

```text
validation error → fix → Generate
generation error → Retry
timeout → Retry
result error → Retry
```

This is a key V1 reliability requirement.

---

# 86. Testing Full Session Loop

Run the visualizer repeatedly.

Example:

```text
Session:
Generate → Result → Retry → Result → Retry → Error → Retry → Result
```

Verify:

- state remains coherent
- memory usage does not visibly degrade
- old results do not reappear
- duplicate calls do not accumulate
- object URLs/resources are cleaned up appropriately

---

# 87. Long-Run Manual Stability Test

Where practical, perform multiple consecutive generation attempts using the mock provider.

Example:

```text
10–20 attempts
```

This is a manual stability check, not a mandatory performance benchmark.

Look for:

- stale state
- memory leaks
- disabled controls that remain disabled
- errors that remain stuck
- incorrect request IDs
- broken retries

Do not claim a numerical guarantee from this test alone.

---

# 88. Mobile Long-Run Test

Repeat:

```text
upload → generate → result → retry
```

multiple times on a small viewport.

Verify:

- no layout drift
- no inaccessible controls
- no accidental duplicate actions
- no keyboard/focus issues
- no persistent loading state

---

# 89. Accessibility Regression

After fixing an error or UI bug, rerun critical accessibility checks.

A functional fix must not silently create:

- missing labels
- broken error associations
- inaccessible disabled state
- focus traps

---

# 90. Documentation Requirements

The test suite should document:

- how to run tests
- how to run unit tests
- how to run integration tests
- how to run E2E tests
- how to activate mock provider modes
- how to reproduce known failures
- supported browser/device assumptions

Update existing project documentation where appropriate.

Do not create redundant documentation files unnecessarily.

---

# 91. Acceptance Criteria

## TEST-001 — Unit Coverage

Core validation, normalization, request, error, and retry logic has automated unit coverage.

---

## TEST-002 — Integration Coverage

Core layer interactions have integration tests.

---

## TEST-003 — E2E Happy Path

The complete core happy path passes.

---

## TEST-004 — E2E Failure Paths

Critical failure scenarios pass.

---

## TEST-005 — Validation Gate

Invalid input never reaches the generation provider.

---

## TEST-006 — Duplicate Protection

Rapid duplicate actions do not create duplicate generation requests.

---

## TEST-007 — Stale Response

Stale async results cannot overwrite current state.

---

## TEST-008 — Error Recovery

Recoverable errors return the visualizer to a usable state.

---

## TEST-009 — Retry

Retry creates a new request using the correct snapshot.

---

## TEST-010 — Result Validation

Malformed results do not enter the success state.

---

## TEST-011 — Accessibility

Critical keyboard and accessibility paths are verified.

---

## TEST-012 — Mobile

Critical mobile flow is verified.

---

## TEST-013 — Browser Coverage

Supported browsers are tested according to project policy.

---

## TEST-014 — Runtime Quality

No unexpected console/runtime errors remain in the core flow.

---

## TEST-015 — Build

The application builds successfully using the repository's standard process.

---

## TEST-016 — Regression

Earlier phase functionality remains intact.

---

## TEST-017 — Mock Independence

All core automated tests run without paid AI credits.

---

## TEST-018 — Release Blockers

No unresolved critical-path blocker remains.

---

## TEST-019 — Honest Reporting

The test report contains actual results only. No fabricated pass counts or unsupported claims.

---

## TEST-020 — Scope Discipline

Testing work does not introduce unrelated product features.

---

# 92. Definition of Done

Phase 8 is complete only when:

- [ ] Unit tests cover critical logic.
- [ ] Integration tests cover major layer boundaries.
- [ ] E2E happy path passes.
- [ ] E2E failure paths pass.
- [ ] Upload tests pass.
- [ ] Validation tests pass.
- [ ] Generate tests pass.
- [ ] Result tests pass.
- [ ] Retry tests pass.
- [ ] Error-recovery tests pass.
- [ ] Duplicate-action tests pass.
- [ ] Stale-response tests pass.
- [ ] Accessibility checks pass for the critical path.
- [ ] Mobile checks pass.
- [ ] Browser checks appropriate to project support pass.
- [ ] Build passes.
- [ ] No unexpected runtime/console errors remain.
- [ ] Regression suite passes.
- [ ] Mock provider is sufficient for automated testing.
- [ ] No production secrets are used in tests.
- [ ] Test report is accurate.
- [ ] No critical blocker remains.
- [ ] No out-of-scope product functionality was added.

---

# 93. Agent Implementation Rules for This Phase

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read `01-PHASE-UPLOAD.md`.
4. Read `02-PHASE-OPTIONS.md`.
5. Read `03-PHASE-VALIDATION.md`.
6. Read `04-PHASE-GENERATE.md`.
7. Read `05-PHASE-RESULT.md`.
8. Read `06-PHASE-RETRY.md`.
9. Read `07-PHASE-ERROR-RECOVERY.md`.
10. Read this file completely before changing tests or implementation.
11. Inspect the existing test infrastructure first.
12. Reuse existing test frameworks and commands.
13. Do not introduce duplicate testing infrastructure without need.
14. Do not use real AI credits for automated tests.
15. Use deterministic mock providers.
16. Test both success and failure paths.
17. Test actual behavior, not implementation details where possible.
18. Add regression tests for bugs discovered during this phase.
19. Do not weaken tests merely to make them pass.
20. Do not delete failing tests without resolving the underlying requirement.
21. Do not fabricate test results.
22. Do not mark blocked tests as passed.
23. Do not add Save, Share, Download, CRM, Analytics, Auth, Estimate, Chat, or Payment features.
24. Do not connect a real AI provider.
25. Do not change product behavior merely to simplify tests without specification approval.
26. Report any test/spec conflict explicitly.
27. Keep the test suite deterministic.
28. Do not mark the phase complete without actual verification.

---

# 94. Completion Report

When implementation/testing is complete, the coding agent must report:

```text
PHASE:
08 — Testing

TEST ENVIRONMENT:
- ...

UNIT TESTS:
- Passed: ...
- Failed: ...
- Blocked: ...

INTEGRATION TESTS:
- Passed: ...
- Failed: ...
- Blocked: ...

E2E TESTS:
- Passed: ...
- Failed: ...
- Blocked: ...

ACCESSIBILITY:
- ...

MOBILE:
- ...

BROWSER:
- ...

BUILD:
- PASS / FAIL

REGRESSION:
- Phase 1: ...
- Phase 2: ...
- Phase 3: ...
- Phase 4: ...
- Phase 5: ...
- Phase 6: ...
- Phase 7: ...

CRITICAL BLOCKERS:
- ...

KNOWN NON-BLOCKING ISSUES:
- ...

FILES CHANGED:
- ...

OUT-OF-SCOPE CHANGES:
- None
```

All numbers must be based on actual executed tests.

---

# 95. Phase Exit Condition

Phase 8 exits successfully when the visualizer's core loop has been tested as a complete system:

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
```

and the implementation has verified:

```text
Happy path works.
Invalid input is blocked.
Generation failures recover.
Timeouts recover.
Result failures recover.
Retry creates a new attempt.
Duplicate actions are prevented.
Stale responses are ignored.
User input is preserved.
Mobile works.
Accessibility works.
Build works.
Regression tests pass.
```

The final principle is:

> Do not call the visualizer production-ready because it works once. Call it ready only after the expected failure modes and recovery paths have been deliberately tested and verified.

**Phase 8 is a verification phase. It must not become an excuse to add unrelated product functionality.**
