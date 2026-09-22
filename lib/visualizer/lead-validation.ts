// Lead-capture validation — mirrors lib/visualizer/validation.ts's pattern (pure,
// aggregate-all-errors-in-one-pass, {code,message} field errors) so the new form
// follows the same house style. Isomorphic: used both client-side (LeadCaptureDialog)
// and server-side (app/api/lead/route.ts, which never trusts the client's own pass).

export type LeadFieldKey = "name" | "email" | "phone"
export type LeadValidationErrorCode = "FIELD_REQUIRED" | "TOO_LONG" | "INVALID_FORMAT"

export interface LeadFieldError {
  code: LeadValidationErrorCode
  message: string
}

export type LeadValidationErrors = Partial<Record<LeadFieldKey, LeadFieldError>>

export interface LeadFormInput {
  name: unknown
  email: unknown
  phone?: unknown
}

export interface ValidatedLeadData {
  name: string
  email: string
  phone: string | null
}

export interface LeadValidationResult {
  valid: boolean
  errors: LeadValidationErrors
  data: ValidatedLeadData | null
}

const NAME_MAX_LENGTH = 120
const PHONE_MAX_LENGTH = 30
// Conservative, not RFC-exhaustive — good enough to catch garbage input without
// pretending to guarantee deliverability (no OTP/verification, per requirements).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Loose: accepts digits, spaces, +, -, (), at least 7 digits total. Not strict E.164.
const PHONE_DIGIT_MIN = 7

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function validateLeadForm(input: LeadFormInput): LeadValidationResult {
  const errors: LeadValidationErrors = {}

  const rawName = typeof input.name === "string" ? input.name.trim() : ""
  if (rawName.length === 0) {
    errors.name = { code: "FIELD_REQUIRED", message: "Please enter your name." }
  } else if (rawName.length > NAME_MAX_LENGTH) {
    errors.name = { code: "TOO_LONG", message: `Please shorten your name to ${NAME_MAX_LENGTH} characters or fewer.` }
  }

  const rawEmail = typeof input.email === "string" ? input.email.trim() : ""
  if (rawEmail.length === 0) {
    errors.email = { code: "FIELD_REQUIRED", message: "Please enter your email." }
  } else if (!EMAIL_PATTERN.test(rawEmail)) {
    errors.email = { code: "INVALID_FORMAT", message: "Please enter a valid email address." }
  }

  const rawPhoneValue = typeof input.phone === "string" ? input.phone.trim() : ""
  let phone: string | null = null
  if (rawPhoneValue.length > 0) {
    if (rawPhoneValue.length > PHONE_MAX_LENGTH) {
      errors.phone = { code: "TOO_LONG", message: `Please shorten your phone number to ${PHONE_MAX_LENGTH} characters or fewer.` }
    } else if (rawPhoneValue.replace(/[^0-9]/g, "").length < PHONE_DIGIT_MIN) {
      errors.phone = { code: "INVALID_FORMAT", message: "Please enter a valid phone number, or leave it blank." }
    } else {
      phone = rawPhoneValue
    }
  }

  const valid = Object.keys(errors).length === 0

  return {
    valid,
    errors,
    data: valid ? { name: rawName, email: normalizeEmail(rawEmail), phone } : null,
  }
}
