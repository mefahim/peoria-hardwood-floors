# Peoria Hardwood Floor Visualizer — Master Specification

**Document:** `00-MASTER-SPEC.md`  
**Status:** Draft v1.0 — Specification before implementation  
**Scope:** V1 Core Visualizer Feature  
**Primary Goal:** Define the complete product/engineering contract for the first reliable implementation of the Visualizer before any coding is delegated to an AI coding agent.

---

## 1. Product Scope

### 1.1 Product

The Visualizer is a website feature for Peoria Hardwood Floors that allows a user to upload a room photograph, choose flooring-related preferences, request an AI-generated flooring visualization, view the result, and retry generation using the same source image and configuration.

### 1.2 V1 Core Loop

The entire V1 implementation is centered on this flow:

```text
Upload
  ↓
Options
  ↓
Validate
  ↓
Generate
  ↓
AI Processing / Mock Processing
  ↓
Result
  ↓
Retry
```

### 1.3 Primary User Outcome

The user should be able to reach a generated visual result without confusion, unnecessary repetition, or uncontrolled failure states.

### 1.4 Current Scope

V1 includes only the functionality required to make the core loop reliable:

- Room image selection/upload
- Image validation
- Image preview
- Image replacement
- Flooring visualization options
- Client-side form/state management
- Validation before generation
- Generation request preparation
- Mock generation engine for development before the real AI API is connected
- Generation loading state
- Successful result display
- Controlled generation failure state
- Retry generation
- Protection against duplicate generation requests
- Preservation of relevant user state during generation and retry
- Basic logging/debugging hooks needed for development and QA

### 1.5 Product Intent

The feature is a lead-generation and visualization experience, but V1 is intentionally limited to the visualization core. Business conversion features may be added later after the core loop is proven reliable.

---

# 2. V1 Objective

## 2.1 Main Objective

Build a stable, predictable, user-friendly Visualizer in which the following journey works consistently:

> A user selects a valid room photo, chooses valid options, starts a generation, sees a clear processing state, receives a result or a recoverable error, and can retry without losing their configuration.

## 2.2 Reliability Objective

The implementation must not depend on the real AI provider during the initial application development phase. The generation layer must be abstracted so a mock provider can be used until an actual AI API is purchased and connected.

## 2.3 Engineering Objective

Separate the UI/business flow from the AI provider implementation.

The frontend/application must not be tightly coupled to one AI vendor or API response format.

## 2.4 User Experience Objective

At every point in the core loop, the user must know:

1. What they need to do.
2. Whether their current input is valid.
3. Whether generation is in progress.
4. Whether generation succeeded.
5. What to do when generation fails.
6. Whether they can safely retry.

## 2.5 Definition of V1 Success

V1 is considered successful only when:

- A valid image can be uploaded and previewed.
- Required options can be selected and retained.
- Invalid input is rejected before generation.
- Generate cannot accidentally submit duplicate requests.
- Generation enters a controlled loading state.
- A successful result is rendered reliably.
- A failed generation produces a recoverable error state.
- Retry repeats generation without unexpectedly clearing the current configuration.
- The complete flow works on supported desktop and mobile layouts.
- Automated/manual acceptance tests for the core loop pass.

---

# 3. User Journey

## 3.1 Primary Journey

```text
Open Visualizer
      ↓
Select / Upload Room Photo
      ↓
Image Validation
      ↓
Image Preview
      ↓
Select Required Options
      ↓
Form Validation
      ↓
Click Generate
      ↓
Generation Processing
      ↓
 ┌───────────────┴───────────────┐
 ↓                               ↓
Success                         Failure
 ↓                               ↓
Show Result                     Show Error
 ↓                               ↓
Retry / Generate Again          Retry
```

## 3.2 Upload Journey

1. User opens the Visualizer.
2. User selects a supported image file.
3. The application validates the file.
4. If valid, the image becomes the current source image.
5. A preview is shown.
6. User may replace the image before generation.
7. If invalid, the current valid image (if any) must not be silently replaced.

## 3.3 Options Journey

The user selects the available flooring configuration values.

Current conceptual option groups:

- Room type
- Project type
- Preferred style
- Wood species
- Floor direction
- Finish preference
- Sheen
- Service city
- Square footage

Final required/optional behavior must be confirmed in the Phase 2 specification before implementation.

## 3.4 Generate Journey

When the user clicks Generate:

1. The current form state is read.
2. Required validation runs.
3. If validation fails, generation does not start.
4. If validation passes, one generation request is created.
5. The UI enters the generating state.
6. Generate controls are protected from duplicate submission.
7. The generation engine returns success or failure.
8. The UI transitions to result or error state.

## 3.5 Retry Journey

Retry means:

> Submit a new generation request using the currently retained source image and currently retained configuration.

Retry must not require the user to re-enter all settings unless explicitly required by a future feature.

---

# 4. Functional Boundaries

## 4.1 Included in V1

### Image handling

- File selection
- File type validation
- File size validation
- Basic image validity/readability validation
- Client preview
- Replace selected image
- Clear upload errors

### Configuration

- Select flooring-related options
- Store configuration in application state
- Validate required options
- Preserve configuration during generation and retry

### Generation

- Build normalized generation request data
- Send request to a generation abstraction/service
- Handle loading state
- Handle success response
- Handle failure response
- Prevent duplicate requests

### Result

- Display generated result
- Keep current configuration associated with the result
- Allow retry

### Development mode

- Mock generation provider
- Deterministic mock success/failure paths for testing

## 4.2 Explicit Functional Boundary

The core application must treat image generation as a service boundary.

The UI must not contain provider-specific assumptions such as vendor-specific response parsing, vendor-specific API keys, or vendor-specific request construction.

Preferred conceptual boundary:

```text
UI / Application
      ↓
Visualization Service Interface
      ↓
Mock Provider OR Real AI Provider
```

## 4.3 Data Boundary

The application should use normalized internal data names even if the eventual AI provider uses different parameter names.

Example:

```json
{
  "roomType": "living_room",
  "projectType": "new_installation",
  "style": "warm_traditional",
  "woodSpecies": "oak",
  "floorDirection": "parallel",
  "finish": "bona_traffic_hd",
  "sheen": "satin",
  "serviceCity": "peoria",
  "squareFootage": 1200
}
```

This example is illustrative. Final allowed values must be defined in the relevant phase specification.

---

# 5. System Architecture

## 5.1 High-Level Architecture

```text
┌─────────────────────────────┐
│         Browser/UI          │
│                             │
│ Upload + Options + Result   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     Application Layer       │
│                             │
│ State + Validation + Flow   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Visualization Service       │
│ Interface / Contract        │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌────────────┐   ┌───────────────┐
│ Mock       │   │ Real AI       │
│ Provider   │   │ Provider      │
│ (V1 dev)   │   │ (later)       │
└────────────┘   └───────────────┘
```

## 5.2 Frontend Responsibilities

The frontend/application layer is responsible for:

- User input
- Local UI state
- Validation feedback
- File preview
- Request initiation
- Loading state
- Error state
- Result rendering
- Retry initiation

It is not responsible for storing secret AI credentials.

## 5.3 Backend/API Responsibilities

When a backend endpoint is used, it is responsible for:

- Validating incoming data
- Enforcing server-side limits
- Normalizing request data
- Constructing provider-specific requests
- Keeping secret credentials server-side
- Normalizing provider responses
- Returning stable application-level responses
- Logging useful request/response metadata without exposing sensitive data

## 5.4 AI Provider Responsibilities

The AI provider is responsible for producing the requested visualization from the provided image and instructions.

The application must not assume that AI output is always valid. AI responses must be treated as untrusted external results and validated before being shown as a successful generation.

## 5.5 Mock Provider Responsibilities

Before the real AI API is integrated, the mock provider must simulate at least:

- Successful generation
- Generation delay/loading
- Generation failure
- Retry behavior
- Invalid/empty-result testing where useful

The mock provider exists to test the application workflow without purchasing an API.

---

# 6. State Model

## 6.1 Core States

```text
IDLE
  ↓
UPLOADING
  ↓
READY
  ↓
GENERATING
  ↓
SUCCESS
```

Failure paths:

```text
UPLOADING → UPLOAD_ERROR
GENERATING → GENERATION_ERROR
```

Retry path:

```text
GENERATION_ERROR
      ↓
     RETRY
      ↓
GENERATING
```

## 6.2 State Definitions

### IDLE

No valid current image or generation in progress.

### UPLOADING

The application is validating/processing the selected image.

### READY

A valid source image exists and the user can configure options and/or generate.

### GENERATING

A generation request is active.

Only one generation request may be active for the current visualizer session unless explicit cancellation/concurrency behavior is later specified.

### SUCCESS

A valid generated result exists and can be rendered.

### UPLOAD_ERROR

The last upload attempt failed. The user must be given a clear recovery action.

### GENERATION_ERROR

Generation failed or returned an unusable result. The current valid image and configuration should remain available for retry.

## 6.3 State Safety Rules

- No generation may start from an invalid form state.
- A second Generate action must not create a duplicate active request.
- Upload errors must not silently destroy a previously valid image.
- Generation failures must not silently clear valid options.
- A successful result must be tied to the configuration that created it.
- Retry must start a new request using the retained source image and configuration.
- The UI must never display a success state without a valid result payload.

## 6.4 Conceptual Application State

```json
{
  "status": "ready",
  "sourceImage": {
    "file": null,
    "previewUrl": null,
    "metadata": {}
  },
  "options": {
    "roomType": null,
    "projectType": null,
    "style": null,
    "woodSpecies": null,
    "floorDirection": null,
    "finish": null,
    "sheen": null,
    "serviceCity": null,
    "squareFootage": null
  },
  "result": null,
  "error": null,
  "requestId": null
}
```

This is a conceptual model, not a mandatory implementation shape.

---

# 7. Core Requirements

## 7.1 Requirement IDs

All implementation requirements must use stable IDs so they can be traced to tests.

Suggested prefixes:

- `UPL-*` — Upload and image handling
- `OPT-*` — Options/configuration
- `VAL-*` — Validation
- `GEN-*` — Generation
- `RES-*` — Result
- `RET-*` — Retry
- `ERR-*` — Error handling
- `SEC-*` — Security
- `TST-*` — Testing

## 7.2 Core Functional Requirements

### Upload

- `UPL-001`: User can select a supported room image.
- `UPL-002`: Unsupported file types are rejected.
- `UPL-003`: File-size limits are enforced.
- `UPL-004`: Unreadable/corrupt files are rejected safely.
- `UPL-005`: A valid image produces a user-visible preview.
- `UPL-006`: User can replace the selected image.
- `UPL-007`: Cancelling file selection does not destroy the current valid image.
- `UPL-008`: Upload failure provides a clear recovery action.

### Options

- `OPT-001`: Each defined option can be selected.
- `OPT-002`: Single-select fields allow only one value at a time.
- `OPT-003`: Current selections are retained until explicitly changed/reset.
- `OPT-004`: Allowed values are defined centrally and are not arbitrary free text unless explicitly specified.
- `OPT-005`: Option data uses normalized internal identifiers.

### Validation

- `VAL-001`: Required fields are validated before generation.
- `VAL-002`: Invalid values prevent generation.
- `VAL-003`: Validation errors identify what the user needs to correct.
- `VAL-004`: Validation does not silently discard valid user input.

### Generation

- `GEN-001`: Generate uses the current valid source image.
- `GEN-002`: Generate uses the current configuration.
- `GEN-003`: Generate cannot submit duplicate active requests through repeated clicks.
- `GEN-004`: The application enters a visible processing state.
- `GEN-005`: The generation service is accessed through an abstraction/service boundary.
- `GEN-006`: Provider credentials are never exposed in client-side code.
- `GEN-007`: Provider responses are validated before being considered successful.

### Result

- `RES-001`: A valid generated result is displayed.
- `RES-002`: Result state is associated with the configuration that generated it.
- `RES-003`: The result state never assumes success when the result payload is missing or invalid.
- `RES-004`: The user has an obvious path to retry.

### Retry

- `RET-001`: Retry is available after a recoverable generation failure.
- `RET-002`: Retry uses the retained source image.
- `RET-003`: Retry uses the retained configuration.
- `RET-004`: Retry creates a new generation request.
- `RET-005`: Retry does not require unnecessary re-entry of the same information.

### Error Handling

- `ERR-001`: Network failures are handled without application crash.
- `ERR-002`: Service/API failures are handled without application crash.
- `ERR-003`: Timeout/failure states provide a recovery path.
- `ERR-004`: Unexpected provider responses are treated as failures, not fake success.
- `ERR-005`: Errors shown to users are understandable and do not expose secret/internal implementation details.

---

# 8. Out-of-Scope Features

The following are explicitly outside V1 unless the scope is intentionally changed and this document is revised.

## 8.1 Business Conversion Features

- Estimate calculator integration
- Lead submission
- CRM integration
- Email/SMS notifications
- Appointment booking
- Sales pipeline

## 8.2 Persistence / Account Features

- User accounts
- User login/signup
- Saved visualization library
- Permanent result history
- Shareable visualization URLs
- Multi-user dashboards

## 8.3 Advanced AI Features

- Conversational refinement
- Multi-turn AI assistant
- Natural-language style changes after generation
- Automatic product recommendations
- Advanced floor segmentation pipeline
- Manual masking/painting tools
- Batch visualization generation

## 8.4 Analytics

- Full product analytics dashboard
- Conversion analytics
- A/B testing infrastructure
- Advanced event tracking platform

Basic development/debug logging may still be used.

## 8.5 Multi-Provider / Platform Abstraction

Although the generation layer must be abstracted enough to allow a provider replacement, V1 does not require multiple real AI providers to be implemented.

## 8.6 Visual Redesign

V1 is not primarily a redesign project. Existing design should be preserved unless a change is required to support functionality, accessibility, error handling, or responsive usability.

---

# 9. Phase Breakdown

## Phase 0 — Specification & Architecture

Purpose: Remove ambiguity before coding.

Deliverables:

- Master specification
- Requirement IDs
- State model
- Data contract
- Phase definitions
- Acceptance strategy

Status: **Current phase**

---

## Phase 1 — Upload & Image Handling

Focus:

- File selection
- Supported formats
- File limits
- Image validation
- Preview
- Replace image
- Upload errors

Output:

A valid room image can reliably become the active source image.

---

## Phase 2 — Options & Form State

Focus:

- All current Visualizer option fields
- Allowed values
- Default behavior
- Required/optional rules
- State storage
- Change/reset behavior

Output:

A valid configuration can be created and retained without ambiguity.

---

## Phase 3 — Validation & User Flow

Focus:

- Cross-field validation
- Generate eligibility
- Error messages
- Invalid-state prevention
- Duplicate-submit prevention

Output:

Only valid generation requests can enter the generation pipeline.

---

## Phase 4 — Generate Pipeline

Focus:

- Generation request object
- Service boundary
- Mock provider
- Loading state
- Request IDs
- Response normalization

Output:

The complete generation lifecycle works without a real AI API.

---

## Phase 5 — AI Integration Boundary

Focus:

- Real AI provider adapter
- Server-side secrets
- Provider request mapping
- Provider response normalization
- Real error handling

Output:

The real AI provider can replace the mock provider without redesigning the application flow.

---

## Phase 6 — Result Handling

Focus:

- Result rendering
- Result validity checks
- Configuration association
- Result state transitions

Output:

Successful generations render reliably.

---

## Phase 7 — Retry & Recovery

Focus:

- Retry behavior
- State preservation
- Failure recovery
- Repeat generation
- Duplicate protection

Output:

A failed generation can be recovered without forcing the user through the entire flow again.

---

## Phase 8 — Error Handling & Hardening

Focus:

- Network failure
- Timeout
- malformed responses
- upload failures
- unusual user behavior
- defensive programming

Output:

Known failure paths are predictable and recoverable.

---

## Phase 9 — State & Session Behavior

Focus:

- Refresh behavior
- Navigation behavior
- temporary state persistence if required
- cleanup

Output:

User state behaves predictably across supported navigation scenarios.

---

## Phase 10 — Security & Abuse Protection

Focus:

- File validation
- Secret protection
- request validation
- rate limiting strategy if required
- unsafe input handling
- resource limits

Output:

The feature does not expose secrets or accept uncontrolled input.

---

## Phase 11 — Responsive & Accessibility QA

Focus:

- mobile interaction
- keyboard support
- focus behavior
- accessible errors/statuses
- touch behavior
- supported browsers/devices

Output:

The core loop is usable across supported viewport types and input methods.

---

## Phase 12 — End-to-End Testing & Acceptance

Focus:

- Happy path
- Invalid input
- Failure scenarios
- Retry
- Mobile
- Regression testing

Output:

V1 Core Loop can be formally accepted as complete.

---

# 10. Global Rules for the AI Coding Agent

These rules apply to every implementation phase.

## 10.1 Specification First

The agent must read, understand, and follow:

1. `00-MASTER-SPEC.md`
2. `AGENT-INSTRUCTIONS.md` (when present)
3. The current phase specification

The phase specification is the immediate implementation source of truth, while this master document defines the overall boundaries and architecture.

## 10.2 No Unrequested Features

The agent must not introduce features that are outside the current phase or explicitly outside V1.

Do not “improve” the product by adding unrelated functionality.

## 10.3 No Assumptions on Ambiguous Requirements

When a requirement is genuinely ambiguous or conflicting, the agent must stop and report the ambiguity instead of silently inventing a product decision.

## 10.4 Preserve Existing Functionality

Changes must not unnecessarily break unrelated existing Visualizer behavior.

If an existing behavior conflicts with this specification, the conflict must be reported and resolved intentionally.

## 10.5 Follow the Defined State Model

State transitions must follow the documented model.

Do not create hidden state transitions that make the UI appear successful when the underlying operation failed.

## 10.6 Fail Safely

Every external operation must have a defined failure path.

The application must prefer:

> Controlled failure + recovery

over:

> Broken UI + silent error

## 10.7 Never Expose Secrets

API keys, tokens, credentials, and server secrets must never be hardcoded into client-side code or committed to source control.

## 10.8 Validate at the Appropriate Boundary

Client-side validation is for user experience.

Server-side validation is for trust/security.

External AI responses are untrusted until validated.

## 10.9 Avoid Tight Provider Coupling

Provider-specific request/response logic must stay inside the provider integration layer.

The rest of the application should use normalized internal contracts.

## 10.10 Test Before Declaring Completion

An AI agent must not claim a phase is complete merely because code was written.

The phase must satisfy its acceptance criteria and relevant tests.

## 10.11 No Silent Workarounds

If a test fails because a requirement cannot be implemented as specified, the agent must report the failure and its cause rather than silently weakening the requirement.

## 10.12 Minimal, Controlled Changes

Implement only what is required for the current phase.

Avoid unnecessary refactors unless they are required for correctness, security, maintainability, or the defined architecture.

## 10.13 Report Changes Clearly

After each phase, the agent must report:

- What was implemented
- Files changed
- Requirements completed
- Tests executed
- Tests passed
- Tests failed
- Known limitations
- Any unresolved ambiguity

## 10.14 Phase Completion Gate

A phase is complete only when all of the following are true:

```text
Requirements implemented
        AND
Acceptance criteria passed
        AND
Relevant tests passed
        AND
No known critical regression
        AND
No unresolved requirement ambiguity
```

---

# Appendix A — Initial Core Loop Contract

## Input

- One valid room photograph
- Valid required flooring configuration

## Processing

- Validate input
- Normalize configuration
- Create generation request
- Execute generation provider
- Validate returned result

## Success Output

- One valid visualization result
- Associated configuration metadata
- Stable generation/request identifier where supported

## Failure Output

- Explicit failure state
- User-readable error
- Recovery path
- Preserved source image/configuration where applicable

## Retry Output

- New generation attempt
- Same source image
- Same current configuration
- Independent request lifecycle

---

# Appendix B — Open Decisions Before Phase Implementation

The following items must be finalized in their respective phase documents before implementation of those phases:

1. Exact maximum upload file size.
2. Exact minimum/maximum image dimensions.
3. Exact accepted MIME types and whether HEIC is supported.
4. Final required/optional status for every current option.
5. Final allowed values and internal IDs for every option.
6. Exact Generate button behavior during processing.
7. Exact result payload contract.
8. Exact mock provider behavior.
9. Exact AI provider selected for real integration.
10. Exact user-facing error copy.
11. Refresh/navigation behavior during active generation.
12. Temporary image-storage strategy.
13. Supported browsers/devices for acceptance testing.

These are intentionally not invented in the Master Specification. They must be explicitly decided before the affected implementation phase begins.

---

# Document Status

**Current state:** Specification foundation complete; implementation has not started.  
**Next required document:** `AGENT-INSTRUCTIONS.md` and then `01-PHASE-UPLOAD.md`.  
**Important:** Do not begin production implementation until the open decisions relevant to the current phase are resolved.
