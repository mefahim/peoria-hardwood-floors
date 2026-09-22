# 03 — PHASE: VALIDATION

## 1. Phase Purpose

This phase defines and implements the **authoritative validation layer** for the Peoria Hardwood Floors Visualizer.

The purpose is to ensure that the application can determine, in a predictable and testable way, whether the current user input is valid and complete enough to proceed to visualization generation.

This phase does **not** generate images and does **not** connect to a real AI provider.

The core principle is:

> The Generate action must never rely on UI appearance alone. It must pass through one authoritative validation process before any generation request is created.

---

# 2. Scope

## 2.1 In Scope

This phase covers:

- Validation of the uploaded source image state.
- Validation of visualization options.
- Validation of conditional fields.
- Validation of service-city values against the approved option set.
- Validation and normalization of square footage.
- Required-field validation.
- Invalid-option detection.
- Cross-field validation where required.
- Final pre-generation validation.
- Structured validation errors.
- Field-level error association.
- Form-level validation summary.
- Generate-button behavior based on validation state.
- Prevention of invalid generation requests.
- Preservation of valid user input when validation fails.
- Validation behavior after replacing the image.
- Validation behavior after changing options.
- Validation behavior after retrying/resetting input.
- Client-side validation architecture.
- Server-side validation contract preparation where a backend exists.
- Test cases for valid, invalid, missing, malformed, and edge-case inputs.

## 2.2 Out of Scope

Do NOT implement in this phase:

- AI image generation.
- Real AI API integration.
- Image editing/masking.
- Prompt generation for the AI provider.
- Result-page implementation.
- Retry generation logic.
- Save/share functionality.
- CRM integration.
- Estimate calculation.
- Authentication.
- Analytics.
- Payment.
- Design-system redesign.
- New visualizer options not defined in Phase 2.

---

# 3. Relationship With Previous Phases

Phase 3 depends on:

- `00-MASTER-SPEC.md`
- `01-PHASE-UPLOAD.md`
- `02-PHASE-OPTIONS.md`
- `AGENT-INSTRUCTIONS.md`

The validation phase does not replace upload validation or option-level validation.

Instead, it creates the **final authoritative gate**.

The intended architecture is:

```text
User Input
   ↓
Phase 1 Upload Validation
   ↓
Normalized Image State
   ↓
Phase 2 Option State
   ↓
Option-Level Validation
   ↓
Phase 3 Final Validation
   ↓
VALID
   ↓
Generate may proceed
```

If any required condition fails:

```text
Invalid Input
   ↓
VALIDATION_ERROR
   ↓
Show actionable errors
   ↓
Preserve existing valid input
   ↓
User fixes input
   ↓
Validate again
```

---

# 4. Validation Principles

The implementation must follow these principles.

## 4.1 One Source of Truth

There must be one authoritative validation function/service for the final Generate gate.

Do not duplicate the same rules across:

- Generate button handler
- individual components
- UI conditionals
- API request builder
- random utility functions

Individual fields may provide immediate feedback, but final validation must use the canonical validator.

---

## 4.2 Validation Must Be Deterministic

Given the same input state, validation must always produce the same result.

Example:

```text
Same image + same options
        ↓
Same validation result
```

Validation must not depend on:

- screen size
- UI rendering order
- browser timing
- network timing
- AI availability

---

## 4.3 No Silent Correction of User Intent

Normalization is allowed where explicitly defined.

Example:

```text
"1200"
```

may normalize to:

```text
1200
```

But invalid values must not silently become valid values.

Do not do:

```text
"abc" → 0
```

or:

```text
-500 → 500
```

or:

```text
unknown-city → first-city
```

---

# 5. Authoritative Validation Input

The validator should operate on normalized application state.

Conceptually:

```js
{
  image: {
    source: File,
    previewUrl: string,
    fileName: string,
    mimeType: string,
    size: number,
    width: number,
    height: number
  },

  options: {
    roomType: string | null,
    projectType: string | null,
    preferredStyle: string | null,
    customStyleDescription: string,
    woodSpecies: string | null,
    floorDirection: string | null,
    finishPreference: string | null,
    sheen: string | null,
    serviceCity: string | null,
    squareFootage: number | null
  }
}
```

The actual implementation may use a different structure if the existing codebase already has an established state model.

Do not refactor the entire application merely to match this example.

---

# 6. Validation Result Contract

The validator should return a predictable structured result.

Recommended shape:

```js
{
  valid: boolean,

  errors: {
    image: null | {
      code: string,
      message: string
    },

    roomType: null | {
      code: string,
      message: string
    },

    projectType: null | {
      code: string,
      message: string
    },

    preferredStyle: null | {
      code: string,
      message: string
    },

    customStyleDescription: null | {
      code: string,
      message: string
    },

    woodSpecies: null | {
      code: string,
      message: string
    },

    floorDirection: null | {
      code: string,
      message: string
    },

    finishPreference: null | {
      code: string,
      message: string
    },

    sheen: null | {
      code: string,
      message: string
    },

    serviceCity: null | {
      code: string,
      message: string
    },

    squareFootage: null | {
      code: string,
      message: string
    }
  },

  summary: string | null
}
```

The exact TypeScript/type implementation may differ.

The important requirement is that validation results must be structured and machine-readable.

---

# 7. Image Validation

The final validation gate must verify that a usable image still exists.

## 7.1 Required Condition

A valid source image must exist.

Invalid states include:

```text
image === null
```

or equivalent empty/invalid state.

Error code:

```text
IMAGE_REQUIRED
```

User-facing message should clearly instruct the user to upload an image.

---

## 7.2 Image Must Still Be Valid

The validator must not assume that an image is valid merely because it was previously accepted.

At minimum, verify that the normalized image state contains the required metadata/state produced by Phase 1.

Expected information includes:

- source
- preview URL
- MIME type
- file size
- width
- height

Do not trust UI-only preview state as proof of validity.

---

# 8. Required Option Validation

The following options are required for V1 visualization according to Phase 2.

| Field | Required |
|---|---:|
| Room Type | Yes |
| Project Type | Yes |
| Preferred Style | Yes |
| Wood Species | Yes |
| Floor Direction | Yes |
| Finish Preference | Yes |
| Sheen | Yes |
| Service City | No |
| Square Footage | No |

`unsure` is a valid explicit option where defined.

Therefore:

```text
unsure ≠ missing
```

For example:

```js
woodSpecies: "unsure"
```

is valid.

But:

```js
woodSpecies: null
```

is missing.

---

# 9. Allowed-Value Validation

Every controlled option must be validated against its canonical allowed-value list.

Example:

```js
roomType:
[
  "kitchen",
  "living_room",
  "hallway",
  "bedroom",
  "office",
  "retail_gym"
]
```

The implementation must use the canonical option definitions from Phase 2 rather than maintaining unrelated duplicate lists.

---

# 10. Invalid Controlled Values

A controlled option is invalid when:

- it is not null where optional, or
- it is not one of the allowed canonical values.

Example:

```js
roomType: "garage"
```

is invalid because it is not currently defined in the approved V1 inventory.

Recommended error code:

```text
INVALID_OPTION_VALUE
```

The error should identify the affected field.

Do not silently convert:

```text
garage → kitchen
```

or:

```text
Oak → oak
```

unless normalization rules explicitly define that transformation.

---

# 11. Room Type Validation

Allowed V1 values:

```text
kitchen
living_room
hallway
bedroom
office
retail_gym
```

Required.

Validation cases:

### Valid

```js
roomType: "kitchen"
```

### Valid

```js
roomType: "retail_gym"
```

### Invalid

```js
roomType: null
```

### Invalid

```js
roomType: "garage"
```

---

# 12. Project Type Validation

Allowed V1 values:

```text
new_installation
refinish_existing_floor
sandless_refresh
commercial_sports
deck
cabinets
```

Required.

Validation cases:

```js
projectType: null
```

→ invalid.

```js
projectType: "new_installation"
```

→ valid.

Unknown values must be rejected.

---

# 13. Preferred Style Validation

Allowed V1 values:

```text
light_natural
warm_traditional
gray_weathered
dark_modern
custom
```

Required.

Validation cases:

```js
preferredStyle: null
```

→ invalid.

```js
preferredStyle: "dark_modern"
```

→ valid.

---

# 14. Custom Style Conditional Validation

When:

```text
preferredStyle === "custom"
```

the field:

```text
customStyleDescription
```

becomes required.

Example:

```js
{
  preferredStyle: "custom",
  customStyleDescription: "Warm medium-brown oak with a natural matte finish"
}
```

→ valid if the description satisfies the defined minimum requirements.

If:

```js
{
  preferredStyle: "custom",
  customStyleDescription: ""
}
```

→ invalid.

Recommended error code:

```text
CUSTOM_STYLE_REQUIRED
```

---

# 15. Custom Style Description Rules

The description must not be whitespace-only.

These are invalid:

```text
""
"   "
"\n"
```

At minimum:

```js
customStyleDescription.trim().length > 0
```

must be true.

Do not impose an arbitrary long minimum description unless the product specification explicitly requires it.

A maximum length should be defined to protect the application and future AI request payload.

Recommended initial maximum:

```text
500 characters
```

This is an implementation recommendation and may be adjusted.

If the maximum is exceeded, return:

```text
CUSTOM_STYLE_TOO_LONG
```

Do not silently truncate the user's description.

---

# 16. Wood Species Validation

Allowed V1 values:

```text
oak
maple
hickory
mixed_unsure
existing_floor
```

Required.

Important:

The current UI/screenshot may visually group Oak, Maple and Hickory under wording that could be interpreted as "wood direction."

The implementation must follow the Phase 2 semantic model:

```text
Wood Species
```

Actual floor direction is a separate field.

If the existing UI and implementation disagree with this model, the agent must report the conflict instead of inventing behavior.

---

# 17. Floor Direction Validation

Allowed V1 values:

```text
parallel
perpendicular
diagonal
herringbone
existing_direction
unsure
```

Required.

Examples:

```js
floorDirection: "parallel"
```

→ valid.

```js
floorDirection: "random"
```

→ invalid.

```js
floorDirection: "unsure"
```

→ valid.

---

# 18. Finish Preference Validation

Allowed V1 values:

```text
bona_traffic_hd
rubio_monocoat
polyurethane
unsure
```

Required.

The validator checks the internal value only.

Do not validate based on visible label text.

---

# 19. Sheen Validation

Allowed V1 values:

```text
matte
satin
semi_gloss
unsure
```

Required.

Examples:

```js
sheen: "satin"
```

→ valid.

```js
sheen: null
```

→ invalid.

---

# 20. Service City Validation

Service City is optional.

Therefore:

```js
serviceCity: null
```

is valid.

However, when a value is supplied, it must belong to the approved service-area list.

Do not invent or expand the city list during this phase.

The canonical list must come from the existing application/business configuration.

If the list cannot be identified from the current codebase, the agent must stop and report the ambiguity rather than creating a guessed list.

---

# 21. Square Footage Validation

Square footage is optional.

Valid states:

```js
squareFootage: null
```

or a valid positive finite number.

Examples:

```text
1200 → 1200
```

```text
"1200" → 1200
```

if normalization is performed before final validation.

Invalid examples:

```text
"abc"
-100
0
NaN
Infinity
-Infinity
```

Recommended error code:

```text
INVALID_SQUARE_FOOTAGE
```

Do not silently convert invalid values to zero or null.

---

# 22. Square Footage Normalization

Recommended normalization pipeline:

```text
Raw Input
   ↓
Trim
   ↓
Empty?
 ├─ Yes → null
 └─ No
   ↓
Numeric conversion
   ↓
Finite?
 ├─ No → validation error
 └─ Yes
   ↓
Positive?
 ├─ No → validation error
 └─ Yes
   ↓
Normalized number
```

Example:

```js
"1200"
```

becomes:

```js
1200
```

Example:

```js
" 1200 "
```

may become:

```js
1200
```

Example:

```js
""
```

becomes:

```js
null
```

Example:

```js
"abc"
```

remains invalid.

---

# 23. Cross-Field Validation

Cross-field validation must only be added when a concrete product rule exists.

Do not invent business rules such as:

```text
commercial_sports requires herringbone
```

or:

```text
deck requires outdoor wood
```

unless explicitly defined elsewhere in the project specification.

For V1, the validator should primarily validate:

- presence
- allowed values
- conditional custom style
- image validity
- square footage format

This prevents accidental product logic from being embedded into validation.

---

# 24. Validation Ordering

Validation should use a predictable order.

Recommended sequence:

```text
1. Image
2. Required controlled options
3. Allowed controlled values
4. Conditional fields
5. Optional supplied fields
6. Final request readiness
```

Example:

```text
Image
 ↓
Room Type
 ↓
Project Type
 ↓
Preferred Style
 ↓
Custom Style
 ↓
Wood Species
 ↓
Floor Direction
 ↓
Finish
 ↓
Sheen
 ↓
Service City
 ↓
Square Footage
```

The implementation may report multiple errors at once.

Do not stop at the first missing field unless the UI architecture specifically requires progressive validation.

---

# 25. Multiple Errors

If multiple required fields are missing, validation should preferably return all actionable field errors in one validation pass.

Example:

```text
Room Type — required
Project Type — required
Wood Species — required
Floor Direction — required
```

The user should not have to fix one unrelated field per request just to discover the next missing field.

---

# 26. Error Codes

Use stable internal error codes.

Recommended initial codes:

```text
IMAGE_REQUIRED
IMAGE_INVALID

FIELD_REQUIRED
INVALID_OPTION_VALUE

CUSTOM_STYLE_REQUIRED
CUSTOM_STYLE_TOO_LONG

INVALID_SERVICE_CITY
INVALID_SQUARE_FOOTAGE
```

The exact code taxonomy may be expanded when implementation reveals a genuine need.

Error codes must be stable even if user-facing wording changes.

---

# 27. Error Messages

Error messages must be:

- clear
- short
- actionable
- associated with the correct field
- understandable without technical knowledge

Bad:

```text
Validation failed.
```

Better:

```text
Please select a room type.
```

Bad:

```text
INVALID_OPTION_VALUE
```

Better:

```text
Please select a valid wood species.
```

Technical error codes may remain available internally.

---

# 28. Generate Button Rules

The Generate action must use final validation.

Possible behavior:

```text
Generate clicked
      ↓
Run validateVisualizerInput()
      ↓
valid?
 ├─ No → show validation errors
 └─ Yes → proceed to generation layer
```

Do not allow generation to start when:

```text
validation.valid === false
```

---

# 29. Disabled vs Validation-on-Click

The UI may disable Generate when required input is obviously incomplete.

However, disabled state must NOT replace final validation.

Correct architecture:

```text
UI readiness indication
        +
authoritative final validation
```

The Generate handler must validate again even if the button appears enabled.

This protects against:

- stale state
- programmatic changes
- race conditions
- future UI changes
- browser edge cases

---

# 30. Validation State

Recommended conceptual state:

```text
UNVALIDATED
    ↓
VALIDATING
    ↓
VALID
    or
INVALID
```

For a simple synchronous validator, `VALIDATING` may be unnecessary internally, but the conceptual separation should remain clear.

Validation state must not be confused with:

```text
AI generation state
```

Generation belongs to a later phase.

---

# 31. Validation Trigger Strategy

Validation should occur at appropriate points.

## 31.1 On Field Interaction

Immediate or deferred field-level feedback may be used.

Do not aggressively show errors before the user has interacted with the field unless the existing UX intentionally does so.

---

## 31.2 On Generate

Always perform full final validation.

This is mandatory.

---

## 31.3 After Fixing an Error

The affected error should disappear once the underlying value becomes valid.

Do not retain stale validation messages after the state is corrected.

---

# 32. Preserve Valid State on Validation Failure

Validation must not destroy valid user input.

Example:

```text
Image uploaded
Room Type selected
Wood Species selected
Floor Direction missing
```

After Generate:

```text
Image → preserved
Room Type → preserved
Wood Species → preserved
Floor Direction → error
```

Do not reset the whole form.

---

# 33. Validation After Image Replacement

When the user replaces the source image:

- validate the new image through Phase 1.
- preserve the existing options unless product requirements explicitly say otherwise.
- rerun final validation after successful replacement.

Do not reset unrelated option values merely because the image changed.

---

# 34. Validation After Option Changes

Changing one option must not invalidate unrelated valid fields.

Example:

```text
Room Type = Kitchen
Wood Species = Oak
Sheen = Satin
```

Changing:

```text
Sheen → Matte
```

must not reset:

```text
Room Type
Wood Species
```

Final validation must use the latest state.

---

# 35. Unsure Values

The following concept is important:

```text
User explicitly selected "Unsure"
```

is a real user choice.

Therefore:

```text
unsure
```

must not be treated as:

```text
null
```

Example:

```js
{
  woodSpecies: "unsure",
  floorDirection: "unsure",
  sheen: "unsure"
}
```

is valid if all other required fields are valid.

---

# 36. Canonical Option Definitions

Validation should consume the same option definitions used by the UI where practical.

Preferred conceptual architecture:

```js
const VISUALIZER_OPTIONS = {
  roomType: [...],
  projectType: [...],
  preferredStyle: [...],
  woodSpecies: [...],
  floorDirection: [...],
  finishPreference: [...],
  sheen: [...]
};
```

The UI and validator should reference the same canonical values.

Avoid:

```text
UI list A
Validator list B
API list C
```

because this creates drift.

---

# 37. Labels vs Internal Values

Never validate labels.

Use stable internal values.

Example:

```js
{
  value: "dark_modern",
  label: "Dark Modern"
}
```

The validator checks:

```text
dark_modern
```

not:

```text
Dark Modern
```

This allows labels to change without breaking validation.

---

# 38. Request Readiness

Phase 3 should define a clean boundary between validated application state and future generation payload creation.

Conceptually:

```text
Application State
      ↓
validateVisualizerInput()
      ↓
VALID
      ↓
buildVisualizationRequest()
      ↓
Future generation phase
```

Do not implement the actual AI request yet.

The validated state should be sufficiently normalized that the next phase does not need to reinterpret user input.

---

# 39. No AI Call During Validation

Validation must never:

- call an AI API
- call an image-generation provider
- call an external prompt service
- consume AI credits
- create a generated image

The validation phase must be fully testable without any paid API.

---

# 40. Security Requirements

Validation must not be considered a security boundary by itself.

If a backend/API exists, server-side validation must independently validate incoming data.

Never trust:

```text
client-side validation
```

as proof of security.

Server-side validation should verify:

- controlled option values
- payload shape
- numeric values
- string length
- uploaded-file constraints
- allowed MIME/type rules where applicable

Never expose:

- API keys
- provider credentials
- private server configuration

to browser JavaScript.

---

# 41. Malformed State Handling

The validator should fail safely when receiving malformed state.

Examples:

```js
options: undefined
```

```js
options: null
```

```js
roomType: {}
```

```js
squareFootage: []
```

The validator should not crash the application.

Instead, return structured validation errors.

Recommended principle:

```text
Malformed input → validation failure
not
Malformed input → runtime crash
```

---

# 42. Defensive Type Handling

The validator must not assume every value has the expected type.

Examples:

```js
roomType: 123
```

```js
sheen: {}
```

```js
customStyleDescription: []
```

must not cause unhandled exceptions.

Controlled values should be checked with safe type guards before comparison.

---

# 43. Whitespace Handling

For free-text fields:

```text
customStyleDescription
```

trim surrounding whitespace for validation.

Example:

```text
"  Natural oak finish  "
```

may normalize to:

```text
"Natural oak finish"
```

But do not alter the semantic content unnecessarily.

---

# 44. Error Visibility

Every validation error must be discoverable by the user.

Preferred:

```text
Field
  ↓
Error message
```

If there is a form-level summary, it must not be the only indication when field-level association is possible.

The user should know:

1. What is wrong.
2. Where it is wrong.
3. What action fixes it.

---

# 45. Accessibility

Validation must work for keyboard and assistive-technology users.

Requirements:

- Error messages must be programmatically associated with their fields.
- Invalid fields should expose an appropriate invalid state.
- Focus behavior should be predictable.
- Do not rely solely on color to indicate errors.
- Error text must be readable.
- Validation should not trap keyboard focus.
- Form-level error summary, if implemented, should be announced appropriately.

Do not introduce inaccessible custom validation UI.

---

# 46. Mobile Behavior

Validation must work on:

- small phones
- large phones
- tablets
- desktop

The validation logic itself must be device-independent.

On mobile:

- error messages must remain visible.
- error text must not overflow.
- fixing a field must be possible without accidental resets.
- keyboard interactions must not break the form state.

---

# 47. Browser Refresh / Navigation

Do not introduce persistent storage solely for this phase.

If the existing application already persists state, validation should safely handle restored state.

Malformed persisted state must not crash the visualizer.

---

# 48. Race Conditions

If validation is asynchronous because image metadata or another existing process requires it, the implementation must avoid stale validation results overwriting newer state.

Example:

```text
State A → validation starts
State B → user changes option
State A → validation finishes late
```

The old result must not incorrectly mark State B as valid.

For a purely synchronous final validator this problem largely disappears.

---

# 49. Duplicate Generate Protection

Phase 3 does not implement generation, but it must prepare the Generate boundary correctly.

The system must not create multiple generation requests from one click because validation is triggered multiple times.

Future generation phases should enforce request idempotency/loading protection.

The validation layer itself must remain side-effect free.

---

# 50. Validation Must Be Side-Effect Free

A pure validation function is strongly preferred.

Conceptually:

```js
const result = validateVisualizerInput(state);
```

The function should:

- read input
- normalize only where explicitly allowed
- return validation result

It should NOT:

- mutate global state unexpectedly
- show UI directly
- make network requests
- call AI
- reset form values
- trigger generation

UI code decides how to display the result.

---

# 51. Recommended Validation Architecture

Preferred separation:

```text
visualizer/
├── state/
├── options/
├── validation/
│   ├── validateImage.js
│   ├── validateOptions.js
│   ├── validateSquareFootage.js
│   └── validateVisualizerInput.js
└── components/
```

This is illustrative.

If the existing codebase uses another architecture, follow the project's established conventions.

Do not create unnecessary files simply to match this example.

---

# 52. Canonical Validator

The central validator should conceptually behave like:

```js
validateVisualizerInput(state)
```

Responsibilities:

1. Validate image.
2. Validate required options.
3. Validate controlled values.
4. Validate conditional custom style.
5. Validate optional supplied values.
6. Return structured errors.
7. Return `valid: true` only when all required rules pass.

---

# 53. Example Valid State

```js
{
  image: {
    source: File,
    previewUrl: "blob:...",
    fileName: "living-room.jpg",
    mimeType: "image/jpeg",
    size: 2450000,
    width: 1920,
    height: 1280
  },

  options: {
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
}
```

Expected:

```js
{
  valid: true
}
```

with no field errors.

---

# 54. Example Invalid State

```js
{
  image: null,

  options: {
    roomType: null,
    projectType: "invalid_project",
    preferredStyle: "custom",
    customStyleDescription: "",
    woodSpecies: "oak",
    floorDirection: null,
    finishPreference: "bona_traffic_hd",
    sheen: "satin",
    serviceCity: null,
    squareFootage: -500
  }
}
```

Expected behavior:

- Image error.
- Room Type required error.
- Project Type invalid-value error.
- Custom Style required error.
- Floor Direction required error.
- Square Footage invalid-value error.

No generation request may proceed.

---

# 55. Example With Unsure

```js
{
  roomType: "kitchen",
  projectType: "new_installation",
  preferredStyle: "warm_traditional",
  customStyleDescription: "",
  woodSpecies: "unsure",
  floorDirection: "unsure",
  finishPreference: "unsure",
  sheen: "unsure"
}
```

Provided a valid image exists:

```text
VALID
```

`unsure` must not generate required-field errors.

---

# 56. Validation and Generate Boundary

The intended future architecture is:

```text
[Generate]
    ↓
validateVisualizerInput(state)
    ↓
┌───────────────┐
│ valid ?       │
└───────┬───────┘
        │
   No   │   Yes
   ↓    │    ↓
Errors  │  Build Request
        │
        │
        └────────→ Generation Phase
```

The validation phase ends at this boundary.

---

# 57. Testing Requirements

The agent must test validation independently from the UI where possible.

Minimum test categories:

## 57.1 Image

- missing image
- valid image
- malformed image state
- missing image metadata

## 57.2 Required Fields

Test every required field as:

- valid
- null
- empty where applicable
- invalid value

## 57.3 Controlled Values

For every controlled field:

- every approved value
- one unknown value
- wrong data type

## 57.4 Custom Style

- custom style with description
- custom style empty
- custom style whitespace-only
- custom style too long
- non-custom style with empty custom description

## 57.5 Square Footage

- null
- valid integer
- valid decimal if supported
- numeric string
- whitespace around numeric string
- empty string
- zero
- negative number
- NaN
- Infinity
- non-numeric string

## 57.6 Unsure

Test all fields where `unsure` is an approved value.

## 57.7 Combined Errors

Verify that multiple invalid fields are returned together.

## 57.8 Recovery

Verify:

```text
invalid → user fixes field → valid
```

without resetting unrelated state.

---

# 58. Acceptance Criteria

## VAL-001 — Canonical Validator

A single authoritative final validation function exists.

---

## VAL-002 — Image Required

Generate cannot proceed without a valid source image.

---

## VAL-003 — Required Options

All V1 required options are validated.

---

## VAL-004 — Controlled Values

Unknown controlled values are rejected.

---

## VAL-005 — Unsure Support

Valid `unsure` values are accepted.

---

## VAL-006 — Custom Style

`customStyleDescription` is required when Preferred Style is `custom`.

---

## VAL-007 — Custom Style Length

Overlong custom descriptions are rejected without silent truncation.

---

## VAL-008 — Service City

An omitted service city is valid.

A supplied invalid service city is rejected.

The approved city list is not invented by the agent.

---

## VAL-009 — Square Footage

Square footage is optional but invalid supplied values are rejected.

---

## VAL-010 — Normalization

Defined normalization rules are applied consistently.

---

## VAL-011 — Structured Errors

Validation returns machine-readable error codes and field associations.

---

## VAL-012 — Actionable Messages

Users can understand how to correct validation errors.

---

## VAL-013 — Multiple Errors

Multiple invalid fields can be reported in one validation pass.

---

## VAL-014 — Generate Gate

Generate is blocked when final validation fails.

---

## VAL-015 — No False Success

No invalid state may be reported as valid.

---

## VAL-016 — Preserve Input

Validation failure does not reset valid user input.

---

## VAL-017 — State Recovery

Fixing invalid input causes the corresponding validation error to clear.

---

## VAL-018 — Malformed State Safety

Malformed input must produce validation failure rather than an unhandled application crash.

---

## VAL-019 — No AI Dependency

The complete phase works without a real AI API.

---

## VAL-020 — No Side Effects

Validation itself does not trigger generation, API calls, or destructive state changes.

---

## VAL-021 — Accessibility

Validation errors are accessible to keyboard and assistive-technology users.

---

## VAL-022 — Mobile

Validation behavior remains functional on mobile layouts.

---

## VAL-023 — Test Coverage

The required validation cases are automated or manually verified and documented.

---

# 59. Definition of Done

Phase 3 is complete only when:

- [ ] Canonical validation exists.
- [ ] Image validity is checked.
- [ ] Required fields are checked.
- [ ] Allowed values are checked.
- [ ] `unsure` is handled correctly.
- [ ] Custom style conditional validation works.
- [ ] Square footage validation works.
- [ ] Service-city validation uses the approved existing list.
- [ ] Invalid values cannot silently pass.
- [ ] Multiple errors are supported.
- [ ] Generate is blocked when invalid.
- [ ] Valid input remains intact after validation failure.
- [ ] Errors clear after correction.
- [ ] Malformed state does not crash the app.
- [ ] Validation has no AI dependency.
- [ ] Validation has no unintended side effects.
- [ ] Accessibility behavior is verified.
- [ ] Mobile behavior is verified.
- [ ] Tests cover happy paths and failure paths.
- [ ] Existing Phase 1 and Phase 2 behavior still works.
- [ ] No out-of-scope features were implemented.

---

# 60. Agent Implementation Rules for This Phase

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read `01-PHASE-UPLOAD.md`.
4. Read `02-PHASE-OPTIONS.md`.
5. Read this file completely before coding.
6. Inspect the existing visualizer implementation before changing anything.
7. Reuse existing state and option definitions when safe.
8. Avoid unnecessary refactoring.
9. Do not invent service cities.
10. Do not invent new business rules.
11. Do not connect a real AI provider.
12. Do not create generation logic beyond the validation boundary.
13. Do not add Save, Share, CRM, Analytics, Auth, Estimate, or Chat features.
14. Keep validation deterministic.
15. Keep validation side-effect free.
16. Use stable internal values.
17. Preserve existing functionality.
18. Test invalid and valid paths.
19. Report any conflict between the existing UI/code and the specification.
20. Do not mark the phase complete if acceptance criteria are failing.

---

# 61. Required Completion Report

When implementation is finished, the coding agent must report:

```text
PHASE:
03 — Validation

IMPLEMENTED:
- ...

VALIDATION RULES:
- ...

TESTS RUN:
- ...

ACCEPTANCE CRITERIA:
- Passed: ...
- Failed: ...

FILES CHANGED:
- ...

OUT-OF-SCOPE CHANGES:
- None
```

If something could not be implemented because of an ambiguity, dependency, or conflict, explicitly state it.

Never claim completion without verification.

---

# 62. Phase Exit Condition

Phase 3 exits successfully when the visualizer has a reliable validation gate such that:

```text
Valid Image
+
Valid Required Options
+
Valid Conditional Fields
+
Valid Optional Supplied Fields
        ↓
VALID
        ↓
Ready for Generation Phase
```

and:

```text
Any Invalid Required Input
        ↓
INVALID
        ↓
Actionable Errors
        ↓
No Generation
```

The next phase may then implement the generation workflow.

**Phase 3 does not generate the image.**

Its job is to guarantee that only a valid, normalized visualization request can reach the generation layer.
