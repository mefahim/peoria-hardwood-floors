# AGENT-INSTRUCTIONS.md

## Purpose

This document defines the global rules for any AI coding agent working on the Peoria Hardwood Visualizer V1.

The agent must follow this document together with `00-MASTER-SPEC.md` and the active phase specification.

These instructions are mandatory unless the project owner explicitly changes them.

---

# 1. Source of Truth

Before making changes, the agent MUST read:

1. `00-MASTER-SPEC.md`
2. `AGENT-INSTRUCTIONS.md`
3. The specification for the active phase

The active phase specification takes priority for phase-specific behavior.

If two documents conflict, STOP and report the conflict. Do not silently choose an interpretation.

---

# 2. Scope Discipline

The V1 core loop is:

**Upload → Options → Generate → Result → Retry**

Do not implement features outside the active phase.

Unless explicitly requested, do NOT add:

- Authentication
- User accounts
- CRM integration
- Estimate/pricing integration
- Save/share functionality
- Analytics
- Chat refinement
- Admin dashboard
- Multi-tenant architecture
- Subscription/billing
- Unrelated UI redesign
- Unrelated refactoring

Future ideas may be documented, but must not be implemented as part of the current phase.

---

# 3. Do Not Invent Requirements

The agent must not invent product behavior.

If a requirement is unclear, missing, contradictory, or technically ambiguous:

1. Identify the ambiguity.
2. Explain why it matters.
3. Stop before implementing the affected behavior.
4. Ask for clarification.

Do not use assumptions to silently fill important gaps.

---

# 4. Preserve Existing Functionality

Before modifying existing code:

- Inspect the relevant implementation.
- Understand current behavior.
- Identify dependencies.
- Avoid unnecessary changes outside the active scope.

Do not rewrite working parts simply because a different implementation is preferred.

If a change could affect another existing feature, identify the risk before proceeding.

---

# 5. Phase-Based Development

Each phase is an independent implementation unit.

For every phase:

1. Read the phase specification.
2. Identify requirements.
3. Identify affected files/components.
4. Implement only the required scope.
5. Run relevant tests/checks.
6. Verify acceptance criteria.
7. Report what was completed.
8. Report any known limitations or failures.

Do not declare a phase complete if required acceptance criteria are failing.

---

# 6. Requirement Traceability

Every important implementation should map back to a requirement ID.

Example:

`UPL-001` → upload validation → corresponding test.

When practical, include requirement IDs in:

- Test names
- Comments for non-obvious logic
- Implementation notes
- Completion reports

The goal is to maintain traceability:

**Requirement → Implementation → Test → Result**

---

# 7. State Management

The agent MUST respect the defined state model.

Do not create hidden or conflicting states.

For every asynchronous operation, explicitly account for:

- Idle
- Loading/processing
- Success
- Failure
- Retry/recovery

Prevent impossible transitions.

Example:

- `GENERATING → GENERATING` through accidental duplicate submission must be prevented.
- `ERROR → SUCCESS` must only happen through a valid retry/new generation.
- A failed upload must not silently destroy a previously valid state unless specified.

---

# 8. Prevent Duplicate Actions

Any action that can trigger an API request, upload, or generation must be protected against accidental duplicate execution.

Examples:

- Double-clicking Generate
- Repeatedly clicking Retry
- Multiple submissions caused by keyboard events
- Repeated requests caused by component re-rendering

Use a clear in-flight state or equivalent mechanism.

The system should produce one intended request per user action.

---

# 9. Validation

Validation must happen at the appropriate boundaries.

## Client-side validation

Use it for immediate user feedback.

Examples:

- File type
- File size
- Required fields
- Numeric values
- Basic input format

## Server-side validation

Never trust client-side validation.

The server must validate all data received from the browser before processing it.

Client validation improves UX.

Server validation protects correctness and security.

---

# 10. Error Handling

Never allow expected errors to produce:

- Blank screens
- Broken layouts
- Unhandled promise rejections
- Silent failures
- Misleading success states

Errors should be:

- Understandable to the user
- Recoverable where possible
- Logged appropriately for debugging
- Associated with a meaningful internal error state/code when useful

User-facing messages should explain what the user can do next.

Example:

Bad:

`Error 500`

Better:

`We couldn't generate your preview right now. Please try again.`

---

# 11. Async / AI Generation Rules

The generation process must be treated as an asynchronous operation.

Minimum conceptual flow:

```text
READY
  ↓
GENERATING
  ↓
SUCCESS
```

or:

```text
READY
  ↓
GENERATING
  ↓
GENERATION_ERROR
  ↓
RETRY
  ↓
GENERATING
```

During generation:

- Prevent duplicate generation.
- Preserve the current configuration.
- Show a clear processing state.
- Handle timeout/failure.
- Do not display a fake success state.
- Do not discard valid user input unnecessarily.

---

# 12. Mock AI Before Real AI

When the real AI API is unavailable, development must use a mock visualization provider.

The frontend/core application must not depend directly on a specific AI vendor.

Conceptually:

```text
Visualizer
    ↓
Visualization Service
    ↓
Provider
```

Current development:

```text
Visualization Service
    ↓
Mock Provider
```

Later:

```text
Visualization Service
    ↓
Real AI Provider
```

The real provider must be replaceable without rewriting the core UI flow.

---

# 13. API and Secret Security

Never expose private credentials in client-side code.

Do NOT place:

- API keys
- Secret tokens
- Private credentials
- Server-only configuration

in:

- Browser JavaScript
- Public environment variables
- HTML
- Client components
- Git repository

AI/provider credentials must remain server-side.

---

# 14. File Upload Security

Treat uploaded files as untrusted input.

The implementation must consider:

- Allowed file types
- MIME validation
- Extension validation
- File size limits
- Image readability
- Malformed/corrupt files
- Server-side validation
- Safe temporary storage
- Cleanup strategy where applicable

Do not trust the filename or extension alone.

---

# 15. Data Integrity

Use consistent internal values.

Example:

```text
Display label:
Living Room

Internal value:
living_room
```

Do not use display text as an unstable business identifier when a controlled value can be used.

The same principle applies to:

- Room types
- Project types
- Styles
- Wood species
- Floor direction
- Finishes
- Sheens

---

# 16. Separate UI Labels from Internal Values

A user-facing label may change without breaking application logic.

Prefer:

```json
{
  "label": "Warm / traditional",
  "value": "warm_traditional"
}
```

rather than relying on the visible string throughout the application.

This makes the system easier to maintain and reduces accidental breakage.

---

# 17. Do Not Hardcode Business Logic in Multiple Places

If a rule is shared, define it once where practical.

Avoid having different definitions of the same option or validation rule in:

- Frontend
- Backend
- Prompt builder
- Tests

Where possible, establish a canonical source and derive dependent behavior from it.

---

# 18. AI Prompt Separation

The AI prompt must not be scattered across UI components.

Keep these concerns separate:

```text
UI configuration
      ↓
Normalized configuration
      ↓
Prompt construction
      ↓
AI provider
```

The frontend should provide structured intent.

The server/provider layer should construct the actual AI instruction.

---

# 19. Do Not Couple the UI to the AI Provider

The UI should not need to know:

- Which AI vendor is being used
- Provider-specific request format
- Provider-specific authentication
- Provider-specific response structure

Use a normalized internal request/response format.

Example internal request:

```json
{
  "image": "...",
  "configuration": {
    "roomType": "living_room",
    "style": "warm_traditional",
    "woodSpecies": "oak",
    "floorDirection": "parallel",
    "finish": "bona_traffic_hd",
    "sheen": "satin"
  }
}
```

The provider adapter can translate this into vendor-specific API requirements.

---

# 20. Testing Requirements

Testing must cover both happy paths and failure paths.

At minimum, consider:

### Upload

- Valid image
- Unsupported format
- Oversized image
- Corrupt image
- Cancelled file selection
- Replacing an existing image

### Options

- Default state
- Selecting each option
- Changing an option
- Required field missing
- Invalid value

### Generate

- Valid generation
- Double-click
- Network failure
- Server failure
- Provider failure
- Timeout
- Empty/invalid provider response

### Result

- Valid result displayed
- Missing result handled
- Retry available after failure
- Configuration preserved

### Retry

- Retry after failure
- Repeated retry clicks
- Same configuration retained
- New generation request created

---

# 21. No False Success

The system must never show a successful result unless a valid result actually exists.

For example:

Do NOT:

```text
API request failed
↓
Show success UI anyway
```

Do:

```text
API request failed
↓
GENERATION_ERROR
↓
Show recovery UI
```

---

# 22. Loading States Must Be Explicit

Every potentially slow operation must have a defined loading state.

Examples:

```text
Uploading...
Generating preview...
Retrying...
```

Avoid ambiguous states where the user cannot tell whether the system is working.

---

# 23. Preserve User Input During Errors

Unless explicitly specified otherwise:

If generation fails:

- Keep uploaded image
- Keep selected options
- Keep relevant form state
- Allow retry

The user should not have to start over after a recoverable failure.

---

# 24. Logging and Debugging

Important failures should be diagnosable.

Where appropriate, record:

- Request ID
- Operation
- Timestamp
- Status
- Error category
- Provider response status
- Safe diagnostic information

Never log secrets, private credentials, or unnecessary sensitive user data.

---

# 25. Accessibility

Accessibility is part of functional correctness.

At minimum:

- Keyboard-accessible controls
- Proper form labels
- Visible focus states
- Accessible error messages
- Appropriate button states
- Meaningful status/loading announcements
- File upload accessible without drag-and-drop

Do not make drag-and-drop the only upload mechanism.

---

# 26. Responsive Functional Behavior

Responsive behavior is not only visual.

The feature must remain usable on:

- Desktop
- Tablet
- Mobile

Test especially:

- File picker
- Form controls
- Generate button
- Loading state
- Result image
- Retry action
- Error messages

Do not assume desktop behavior automatically works on mobile.

---

# 27. Browser Console and Runtime Quality

Before declaring a phase complete:

- No unexplained console errors
- No unhandled promise rejections
- No obvious runtime warnings related to the implementation
- No broken network requests
- No failed required assets

Known unrelated legacy warnings may be reported separately rather than silently ignored.

---

# 28. Dependency Discipline

Do not add a package simply because it makes one small task easier.

Before adding a dependency:

1. Check whether the existing stack can solve the problem.
2. Check whether the package is actually necessary.
3. Consider maintenance/security implications.
4. Explain the reason for adding it.

Do not upgrade unrelated dependencies during a focused phase unless required.

---

# 29. Minimal, Safe Changes

Prefer the smallest implementation that satisfies the specification.

Do not:

- Refactor unrelated code
- Rename unrelated files
- Change architecture without justification
- Replace libraries unnecessarily
- Redesign unrelated components

Small controlled changes are easier to test and debug.

---

# 30. Completion Report

After each phase, report:

```text
Phase:
Status:

Implemented:
- ...

Tests/checks:
- ...

Acceptance criteria:
- PASS / FAIL

Known issues:
- ...

Files changed:
- ...

Out of scope:
- ...
```

If anything required is not working, report it honestly.

Do not claim completion based only on code generation.

---

# 31. Stop Conditions

The agent MUST stop and request clarification when:

- Requirements conflict
- A required technical decision is undefined
- A change could cause significant data loss
- A security-sensitive decision is ambiguous
- The implementation requires an out-of-scope feature
- The requested behavior cannot be implemented safely with the documented architecture
- A phase acceptance criterion cannot be satisfied without changing the specification

---

# 32. Definition of Done

A phase is complete only when:

- All required functionality is implemented.
- Required validation exists.
- Expected error states are handled.
- Relevant edge cases are considered.
- Required tests/checks pass.
- No known critical regression exists.
- Acceptance criteria are satisfied.
- The implementation remains within scope.
- Any unresolved issue is explicitly documented.

---

# 33. Core Principle

The agent is an implementer, not the product owner.

The agent should:

**Understand → Implement → Test → Report**

Not:

**Guess → Implement → Expand scope**

When in doubt, preserve existing behavior, follow the specification, and ask before making a product-level decision.
