# 02-PHASE-OPTIONS.md

# Phase 2 — Options & Configuration

## 1. Phase Purpose

Phase 2 defines and implements the Visualizer's option-selection system.

The goal is to let a user configure the intended flooring visualization in a predictable, validated, user-friendly way while preserving the valid uploaded image from Phase 1.

This phase does **not** call the real AI provider and does **not** generate the final visualization.

The output of this phase is a complete, normalized configuration that the Generate phase can consume.

---

# 2. Scope

## In Scope

- Options UI behavior
- Option definitions
- Single-selection behavior
- Numeric input behavior
- Required/optional rules
- Defaults
- Internal values
- Configuration state
- Changing selections
- Preserving uploaded image
- Configuration normalization
- Basic client-side validation
- Conditional option behavior where explicitly defined
- Configuration readiness for Phase 3/Generate

## Out of Scope

Do not implement:

- Real AI generation
- AI prompt construction
- AI provider integration
- Result display
- Retry generation
- Save/share
- Estimate calculation
- CRM
- Analytics
- Authentication
- New visual design system
- New business features

---

# 3. User Goal

The user should be able to configure the type of flooring visualization they want without confusion.

The user must be able to:

1. View all required options.
2. Select one value where a single value is required.
3. Change a selection before generation.
4. Enter square footage when applicable.
5. Leave explicitly optional fields empty.
6. Understand which fields are required.
7. Continue without losing the uploaded image.
8. Produce a normalized configuration ready for generation.

---

# 4. Configuration Model

The Visualizer configuration should be represented conceptually as:

```js
{
  roomType: null,
  projectType: null,
  preferredStyle: null,
  woodSpecies: null,
  floorDirection: null,
  finishPreference: null,
  sheen: null,
  serviceCity: null,
  squareFootage: null
}
```

The exact implementation may use a different state-management mechanism.

The important requirements are:

- One authoritative configuration state.
- Stable internal values.
- No duplicated conflicting option state.
- Options remain available when the user changes another option.
- Configuration is separate from the uploaded image state.

---

# 5. Option Inventory

The current Visualizer option groups are:

1. Room Type
2. Project Type
3. Preferred Style
4. Wood Species
5. Floor Direction
6. Finish Preference
7. Sheen
8. Service City
9. Square Footage

The current UI contains Oak/Maple/Hickory under a heading that appears to refer to wood direction. This specification treats those values as **Wood Species**.

If the existing implementation actually uses those controls for another purpose, the conflict must be reported before implementation.

---

# 6. Room Type

## Field

```text
Key: roomType
Type: single select
Required: Yes
```

## Initial values

```text
kitchen
living_room
hallway
bedroom
office
retail_gym
```

## Display labels

```text
Kitchen
Living room
Hallway
Bedroom
Office
Retail / gym
```

Internal values must remain stable even if display labels change.

## Behavior

- Only one room type can be selected.
- Selecting another value replaces the previous selection.
- No multiple selection.
- No silent automatic selection unless a default is explicitly configured.

---

# 7. Project Type

## Field

```text
Key: projectType
Type: single select
Required: Yes for the current V1 configuration
```

## Initial values

```text
new_installation
refinish_existing_floor
sandless_refresh
commercial_sports
deck
cabinets
```

## Display labels

```text
New installation
Refinish existing floor
Sandless refresh
Commercial / sports
Deck
Cabinets
```

## Important Functional Rule

Project type may affect whether a particular visualization workflow is appropriate.

For this phase, the option must be stored accurately.

Do not create project-specific AI behavior in Phase 2.

If a project type later requires a different visualization pipeline, that behavior belongs in the generation/domain logic and must be explicitly specified.

---

# 8. Preferred Style

## Field

```text
Key: preferredStyle
Type: single select
Required: Yes
```

## Initial values

```text
light_natural
warm_traditional
gray_weathered
dark_modern
custom
```

## Display labels

```text
Light / natural
Warm / traditional
Gray / weathered
Dark / modern
Custom
```

## Custom Behavior

If `custom` is selected, an additional description input should become available.

Conceptually:

```js
{
  preferredStyle: "custom",
  customStyleDescription: ""
}
```

The description is required only when the Custom option is selected.

Suggested placeholder:

> Describe the look you want

Example:

> Warm medium-brown oak with a natural appearance.

## Validation

If `custom` is selected and the description is empty:

> Please describe the style you want.

Do not require a custom description for non-custom styles.

---

# 9. Wood Species

## Field

```text
Key: woodSpecies
Type: single select
Required: Yes
```

## Initial values

```text
oak
maple
hickory
mixed_unsure
existing_floor
```

## Display labels

```text
Oak
Maple
Hickory
Mixed / unsure
Existing floor
```

## Important Rule

This field represents the wood/material selection.

It must not be named or internally represented as `woodDirection`.

---

# 10. Floor Direction

## Field

```text
Key: floorDirection
Type: single select
Required: Yes
```

## Initial values

```text
parallel
perpendicular
diagonal
herringbone
existing_direction
unsure
```

## Display labels

```text
Parallel
Perpendicular
Diagonal
Herringbone
Existing direction
Unsure
```

If the current UI does not yet expose these choices, implementation should not invent a different interaction. The missing UI should be reported if this requirement conflicts with the current product scope.

---

# 11. Finish Preference

## Field

```text
Key: finishPreference
Type: single select
Required: Yes
```

## Initial values

```text
bona_traffic_hd
rubio_monocoat
polyurethane
unsure
```

## Display labels

```text
Bona Traffic HD
Rubio Monocoat
Polyurethane
Unsure
```

Internal values must be stable and must not depend on display formatting.

The actual technical meaning of each finish belongs to the AI/domain mapping layer, not the UI.

---

# 12. Sheen

## Field

```text
Key: sheen
Type: single select
Required: Yes
```

## Initial values

```text
matte
satin
semi_gloss
unsure
```

## Display labels

```text
Matte
Satin
Semi-gloss
Unsure
```

Only one value may be selected.

---

# 13. Service City

## Field

```text
Key: serviceCity
Type: single select
Required: No for visualization
```

The city list must use the existing approved service-area list from the project.

Do not invent additional service locations.

The selected city should be stored as a stable internal value.

Example:

```js
{
  label: "Peoria",
  value: "peoria"
}
```

## Functional Rule

Service city must not block image visualization unless the product owner explicitly defines it as required for generation.

This is business/lead information rather than an essential visual-generation parameter.

---

# 14. Square Footage

## Field

```text
Key: squareFootage
Type: numeric input
Required: No for visualization
```

## Accepted input

A positive numeric value.

Examples:

```text
500
850
1200
1500.5
```

## Rejected input

Examples:

```text
-200
0
abc
12abc
```

If decimal square footage is not required by the business, the implementation may restrict the field to whole numbers, but that decision must remain consistent throughout the application.

## Optional behavior

If the user does not know the square footage, they should be able to leave this field empty.

Do not block visualization solely because square footage is unavailable.

---

# 15. Required vs Optional Summary

| Field | Required for visualization |
|---|---|
| Room Type | Yes |
| Project Type | Yes in current V1 configuration |
| Preferred Style | Yes |
| Wood Species | Yes |
| Floor Direction | Yes |
| Finish Preference | Yes |
| Sheen | Yes |
| Service City | No |
| Square Footage | No |

If business requirements later change these rules, update the specification rather than adding hidden exceptions in code.

---

# 16. Default Values

The default state should not silently choose a preference on behalf of the user unless the product explicitly wants that behavior.

Preferred initial state:

```js
{
  roomType: null,
  projectType: null,
  preferredStyle: null,
  customStyleDescription: "",
  woodSpecies: null,
  floorDirection: null,
  finishPreference: null,
  sheen: null,
  serviceCity: null,
  squareFootage: null
}
```

A field may have a documented default later if a deliberate product decision is made.

---

# 17. Single-Select Behavior

All enumerated option groups in this phase are single-select unless explicitly specified otherwise.

Rules:

- Selecting an option selects it.
- Selecting another option deselects the previous value.
- There is never more than one active value per field.
- Keyboard selection must work.
- Programmatic state must match the visible selected state.

---

# 18. Changing Options

Users must be able to change any selected option before generation.

Example:

```text
Oak
↓
Maple
```

Expected state:

```js
woodSpecies = "maple"
```

No stale `oak` value should remain in the normalized configuration.

Changing one option must not reset unrelated options.

Example:

```text
Change wood species
```

must not clear:

```text
roomType
preferredStyle
sheen
```

unless a documented dependency explicitly requires it.

---

# 19. Conditional Fields

The only conditional field currently defined in this phase is:

```text
preferredStyle = custom
```

which exposes:

```text
customStyleDescription
```

If future option dependencies are needed, they must be explicitly specified.

Do not create implicit dependencies based on assumptions.

---

# 20. Unsure Options

Some options intentionally include `unsure`.

This represents a legitimate user choice.

Selecting `unsure` must:

- Be accepted as valid.
- Be stored as an explicit internal value.
- Not be treated as missing.
- Not cause a validation error.

Example:

```js
sheen = "unsure"
```

is valid.

The decision about how `unsure` maps to an AI instruction belongs to the generation/prompt layer.

---

# 21. Configuration Normalization

Before passing configuration to the Generate phase, convert it to a stable normalized object.

Example:

```json
{
  "roomType": "living_room",
  "projectType": "new_installation",
  "preferredStyle": "warm_traditional",
  "customStyleDescription": "",
  "woodSpecies": "oak",
  "floorDirection": "parallel",
  "finishPreference": "bona_traffic_hd",
  "sheen": "satin",
  "serviceCity": "peoria",
  "squareFootage": 1200
}
```

Optional empty values may be represented consistently as `null` rather than mixed empty strings.

The exact representation must be consistent across the application.

---

# 22. Image State Must Be Preserved

Changing options must never remove or replace the valid uploaded image.

Example:

```text
Valid image
+
Oak
↓
Change to Maple
↓
Same image
+
Maple
```

The upload state and configuration state are separate concerns.

---

# 23. Validation Boundary

Client-side validation should provide immediate feedback.

Before Generate:

```text
Check required configuration
Check custom style description if needed
Check square footage if supplied
Check values are from allowed lists
```

The Generate phase must perform the final validation before sending a request.

Phase 2 should not assume that frontend state is automatically trustworthy.

---

# 24. Invalid/Unexpected Values

If state contains an unsupported value:

```text
woodSpecies = "banana"
```

it must not be silently accepted.

The application should treat the configuration as invalid and require correction.

Do not send unsupported option values to the generation backend.

---

# 25. Numeric Input Rules

Square footage must be normalized before generation.

Examples:

```text
"1200" → 1200
"1200.5" → 1200.5
"" → null
```

Whitespace should be handled consistently.

Do not allow `NaN`, `Infinity`, negative values, or invalid numeric strings into normalized configuration.

---

# 26. Option Configuration Source

Option definitions should have a canonical source where practical.

Conceptually:

```js
const roomTypes = [
  { value: "kitchen", label: "Kitchen" },
  { value: "living_room", label: "Living room" }
];
```

Do not duplicate the same option list independently in multiple components.

The validation logic should derive allowed values from the same canonical definitions whenever practical.

---

# 27. Accessibility

All options must be accessible.

Requirements:

- Proper labels
- Keyboard navigation
- Visible selected state
- Visible focus state
- Screen-reader-readable labels
- Required status communicated accessibly
- Errors associated with the relevant field

Do not rely only on visual color to communicate selection.

---

# 28. Mobile Functional Requirements

On mobile:

- All options remain selectable.
- Selection must not depend on hover.
- Controls must be touch-friendly.
- Numeric input must use an appropriate mobile keyboard/input mode.
- The user must be able to scroll through all options.
- Changing an option must not unexpectedly scroll/reset the form.
- Selected values must remain visible/understandable.

---

# 29. Error Behavior

Validation errors must be specific.

Examples:

### Missing room type

> Please choose a room type.

### Missing style

> Please choose a preferred style.

### Custom style missing description

> Please describe the style you want.

### Invalid square footage

> Please enter a valid square footage.

Do not show generic messages such as:

> Invalid form.

when the specific field can be identified.

---

# 30. Form Submission Behavior

Phase 2 does not perform generation.

The configuration should instead expose a readiness check equivalent to:

```js
isConfigurationReady()
```

This should return:

```text
true
```

only when all required fields are valid.

Optional fields may remain empty.

The actual generation request belongs to the next phase.

---

# 31. No Hidden Auto-Corrections

The application must not silently transform user choices into a different choice.

Examples:

```text
User selects Maple
→ system silently changes to Oak
```

Not allowed.

If a value is incompatible with a future workflow, that incompatibility must be explicitly handled and documented.

---

# 32. Test Matrix

## Room Type

Test every available value.

## Project Type

Test every available value.

## Style

Test every standard style and Custom.

## Wood

Test Oak, Maple, Hickory, Mixed/unsure, Existing floor.

## Direction

Test every available direction.

## Finish

Test every available finish.

## Sheen

Test every available sheen including Unsure.

## City

Test valid service-area values.

## Square Footage

Test:

- Empty
- Positive integer
- Positive decimal if supported
- Zero
- Negative
- Text
- Mixed text/numbers
- Very large number
- Whitespace

## Cross-field

Test:

- Change one option after selecting all others.
- Change multiple options.
- Select Custom then leave description empty.
- Select Custom, enter description, then change to a standard style.
- Replace uploaded image while options are selected.
- Change options after image upload.
- Invalid configuration does not destroy valid upload state.

---

# 33. Acceptance Criteria

### OPT-001 — Configuration State

All option values are represented in one consistent configuration state.

### OPT-002 — Room Selection

User can select exactly one room type.

### OPT-003 — Project Selection

User can select exactly one project type.

### OPT-004 — Style Selection

User can select a preferred style.

### OPT-005 — Custom Style

Selecting Custom exposes a custom description field.

### OPT-006 — Custom Validation

Custom style requires a description before configuration is considered ready.

### OPT-007 — Wood Species

User can select exactly one wood species.

### OPT-008 — Floor Direction

User can select exactly one floor direction.

### OPT-009 — Finish

User can select exactly one finish preference.

### OPT-010 — Sheen

User can select exactly one sheen.

### OPT-011 — Service City

User may select a supported service city without making it a visualization requirement.

### OPT-012 — Square Footage

User can provide valid numeric square footage or leave it empty.

### OPT-013 — Option Changes

Changing one option does not unexpectedly reset unrelated options.

### OPT-014 — Image Preservation

Changing options never removes a valid uploaded image.

### OPT-015 — Stable Values

Display labels and internal values are separated.

### OPT-016 — Unsure Values

`unsure` is treated as a valid explicit selection where provided.

### OPT-017 — Normalization

A valid configuration can be converted into a normalized object.

### OPT-018 — Invalid Values

Unsupported values are rejected before generation.

### OPT-019 — Accessibility

All option controls are keyboard accessible and properly labeled.

### OPT-020 — Mobile

All options remain functionally usable on supported mobile browsers.

---

# 34. Definition of Done

Phase 2 is complete only when:

- [ ] All defined option groups exist.
- [ ] Internal values are stable.
- [ ] Display labels are separated from internal values.
- [ ] Required/optional behavior is implemented.
- [ ] Single-select behavior works.
- [ ] Custom style behavior works.
- [ ] Square footage validation works.
- [ ] Unsure values work.
- [ ] Changing selections preserves unrelated state.
- [ ] Uploaded image state is preserved.
- [ ] Invalid configuration is detected.
- [ ] Normalized configuration can be produced.
- [ ] Keyboard accessibility is tested.
- [ ] Mobile behavior is tested.
- [ ] Relevant acceptance criteria pass.
- [ ] No real AI generation has been introduced.
- [ ] No out-of-scope feature has been introduced.
- [ ] No critical runtime/console errors exist.

---

# 35. Agent Implementation Rules

The coding agent must:

1. Read `00-MASTER-SPEC.md`.
2. Read `AGENT-INSTRUCTIONS.md`.
3. Read `01-PHASE-UPLOAD.md`.
4. Read this document before implementation.
5. Inspect the existing option implementation.
6. Preserve the completed Upload phase.
7. Implement only the option/configuration behavior defined here.
8. Do not implement AI generation.
9. Do not invent missing option values.
10. Report conflicts between the existing UI and this specification.
11. Use canonical option definitions where practical.
12. Keep upload state separate from configuration state.
13. Test all acceptance criteria.
14. Do not proceed to the next phase until this phase is verified.

---

# 36. Phase Output

At the end of Phase 2, the application must have:

```text
VALID UPLOADED IMAGE
        +
VALID NORMALIZED CONFIGURATION
        ↓
READY FOR GENERATION PHASE
```

No AI request should be made by this phase.

No real AI API is required for Phase 2.
