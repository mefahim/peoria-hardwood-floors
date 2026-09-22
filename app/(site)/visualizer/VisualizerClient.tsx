"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, CheckCircle2, ImagePlus, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { type NormalizedImage, type UploadStatus, validateAndNormalizeImageFile } from "@/lib/visualizer/image-upload"
import {
  CUSTOM_STYLE_VALUE,
  FINISH_PREFERENCE_OPTIONS,
  FLOOR_DIRECTION_OPTIONS,
  INITIAL_VISUALIZER_OPTIONS,
  type OptionDef,
  PREFERRED_STYLE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SERVICE_CITY_OPTIONS,
  SHEEN_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  type VisualizerOptions,
  normalizeSquareFootageInput,
} from "@/lib/visualizer/options"
import { validateVisualizerInput } from "@/lib/visualizer/validation"
import {
  buildGenerationSnapshot,
  createRequestId,
  type GenerationError,
  type GenerationStatus,
  type NormalizedGenerationResult,
  shouldApplyGenerationResponse,
  type VisualizationGenerationSnapshot,
} from "@/lib/visualizer/generation"
import { runGeneration } from "@/lib/visualizer/generation-client"
import { buildResultAltText, isUsableResultImageReference, RESULT_ERROR_MESSAGES, type ResultError } from "@/lib/visualizer/result"
import { logVisualizerError, normalizeUnknownError, toGenerationAppError, toResultAppError } from "@/lib/visualizer/errors"
import { LeadCaptureDialog } from "@/app/(site)/visualizer/LeadCaptureDialog"
import { isQuotaDeniedResponse, type VisitorQuotaStatus } from "@/lib/visualizer/quota-types"

function formatCooldownMessage(cooldownUntil: string | null): string {
  if (!cooldownUntil) return "You've used today's free visualization. Please check back soon."
  const remainingMs = new Date(cooldownUntil).getTime() - Date.now()
  if (remainingMs <= 0) return "Your next free visualization is available now — please try again."
  const hours = Math.floor(remainingMs / (60 * 60 * 1000))
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
  const parts = [hours > 0 ? `${hours}h` : null, `${minutes}m`].filter(Boolean)
  return `You've used today's free visualization. Next one available in ${parts.join(" ")}.`
}

// Decorative color-preview overlay, keyed by the internal preferredStyle value.
const swatches: Record<string, string> = {
  light_natural: "#c79d69",
  warm_traditional: "#9a633d",
  gray_weathered: "#8d8981",
  dark_modern: "#4a3028",
  custom: "#76513b",
}

function OptionButtons<T extends string>({
  id,
  legend,
  options,
  selected,
  onSelect,
  error,
  disabled,
}: {
  id: string
  legend: string
  options: readonly OptionDef<T>[]
  selected: T | null
  onSelect: (value: T) => void
  error?: string
  disabled?: boolean
}) {
  const errorId = `${id}-error`
  return (
    <fieldset aria-describedby={error ? errorId : undefined} disabled={disabled}>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={legend}>
        {options.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              type="button"
              key={option.value}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.value)}
              disabled={disabled}
              className={`border px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}

export default function VisualizerPage() {
  const [options, setOptions] = useState<VisualizerOptions>(INITIAL_VISUALIZER_OPTIONS)

  // Phase 3: whether the user has attempted Generate at least once. Validation errors
  // are only surfaced after a real attempt, but once shown they track the live state below.
  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false)

  // Phase 4: explicit generation state machine (idle -> validating -> creating_request
  // -> generating -> success | error | timeout). `generationSnapshot` is the immutable
  // request snapshot for the current/last attempt (kept for retry-prep, per
  // 04-PHASE-GENERATE.md §41, even after the attempt finishes). `loading` derives from
  // status rather than being tracked separately, so it can never drift out of sync.
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle")
  const [generationResult, setGenerationResult] = useState<NormalizedGenerationResult | null>(null)
  const [generationError, setGenerationError] = useState<GenerationError | null>(null)
  const loading = generationStatus === "validating" || generationStatus === "creating_request" || generationStatus === "generating"

  // Phase 5: the result has its own lifecycle, separate from generation status
  // (05-PHASE-RESULT.md §12/§24) — a provider can report SUCCESS while the
  // browser still hasn't (or can't) actually display the image. `resultSnapshot`
  // is the exact generation snapshot that produced the CURRENT result (never
  // read from live form state — §19/§20), used only for a meaningful alt text.
  const [resultImageLoadStatus, setResultImageLoadStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle")
  const [resultError, setResultError] = useState<ResultError | null>(null)
  const [resultSnapshot, setResultSnapshot] = useState<VisualizationGenerationSnapshot | null>(null)

  // Phase 6: the snapshot behind whatever attempt the user is currently looking
  // at — set after EVERY attempt (success, error, or timeout), unlike
  // `resultSnapshot` which is Phase 5's success-only concept. This is Retry's
  // sole source of truth (06-PHASE-RETRY.md §8, §17-20): Retry rebuilds its
  // input from this frozen snapshot, never from live `image`/`options` state.
  const [retrySnapshot, setRetrySnapshot] = useState<VisualizationGenerationSnapshot | null>(null)

  // Tracks the previous result's image URL so a future real provider's blob:
  // URLs can be revoked on replacement (05-PHASE-RESULT.md §36-37). The current
  // mock provider returns a static asset path, never a blob: URL, so this is
  // defensive/forward-compatible scaffolding rather than something exercised today.
  const resultImageUrlRef = useRef<string | null>(null)
  useEffect(() => {
    resultImageUrlRef.current = generationResult?.imageUrl ?? null
  }, [generationResult])
  useEffect(() => {
    return () => {
      if (resultImageUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(resultImageUrlRef.current)
    }
  }, [])

  // The requestId of the currently-active generation attempt. Compared against
  // every incoming response so a late/stale result can never overwrite newer
  // state (04-PHASE-GENERATE.md §23) — set synchronously, never derived from React state.
  const activeRequestIdRef = useRef<string | null>(null)

  // Synchronous duplicate-generation guard (04-PHASE-GENERATE.md §21-22). A ref is used
  // instead of state because it must block a second click within the same tick, before
  // any re-render could reflect an updated `generationStatus`.
  const generationLockRef = useRef(false)

  // Server-enforced quota status (never trusted as the actual enforcement — that
  // happens in app/api/visualizer/route.ts — this is only for showing the right
  // messaging and avoiding a wasted upload when we already know a lead is required).
  const [quotaState, setQuotaState] = useState<VisitorQuotaStatus | null>(null)
  const [leadDialogOpen, setLeadDialogOpen] = useState(false)
  const pendingCandidateRef = useRef<{ image: NormalizedImage | null; options: VisualizerOptions } | null>(null)

  async function refreshQuota() {
    try {
      const res = await fetch("/api/visualizer/quota")
      if (res.ok) setQuotaState(await res.json())
    } catch {
      // Non-fatal — the banner just stays as whatever it last showed; actual
      // enforcement never depends on this client-side state.
    }
  }

  useEffect(() => {
    refreshQuota()
  }, [])

  function setOption<K extends keyof VisualizerOptions>(key: K, value: VisualizerOptions[K]) {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  // Phase 1 upload state: one authoritative image, one authoritative status, one authoritative error.
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [image, setImage] = useState<NormalizedImage | null>(null)
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null)

  const imageRef = useRef<NormalizedImage | null>(null)
  const validationTokenRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    imageRef.current = image
  }, [image])

  // Revoke the last preview object URL on unmount so it isn't leaked.
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl)
    }
  }, [])

  async function handleImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset the native input immediately so the same file can be reselected later.
    event.target.value = ""

    // No file means the picker was cancelled — not an error, state is left as-is.
    if (!file) return

    const token = ++validationTokenRef.current
    setUploadStatus("validating")
    setUploadErrorMessage(null)

    const validation = await validateAndNormalizeImageFile(file)

    // A newer selection superseded this one, or the component unmounted mid-decode — discard the stale result.
    if (validationTokenRef.current !== token || !isMountedRef.current) {
      if (validation.ok) URL.revokeObjectURL(validation.image.previewUrl)
      return
    }

    if (!validation.ok) {
      setUploadStatus("validation_error")
      setUploadErrorMessage(validation.error.message)
      return
    }

    if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl)
    setImage(validation.image)
    setUploadStatus("ready")
  }

  // Phase 3: the single authoritative validation gate. Recomputed on every render from
  // the live image/options state, so once errors are shown (see hasAttemptedGenerate)
  // they clear automatically the moment the underlying field becomes valid — no
  // separate "clear stale error" bookkeeping needed. Named distinctly from the
  // per-file image-validation `validation` local inside handleImageSelected above.
  const inputValidation = validateVisualizerInput({ image, options })
  const errors = hasAttemptedGenerate ? inputValidation.errors : {}

  // Phase 4/6: the single generation pipeline shared by Generate and Retry
  // (06-PHASE-RETRY.md §5/§7 — "avoid duplicated provider/API logic"). A
  // workflow transition (IDLE -> VALIDATING -> CREATING_REQUEST -> GENERATING
  // -> SUCCESS/ERROR/TIMEOUT), not just a fetch call. `candidate` is whichever
  // image/options pair the caller wants validated and generated: the live form
  // state for Generate, or the frozen retry snapshot's own image/options for
  // Retry — this function never knows or cares which one it received.
  async function runGenerationAttempt(candidate: { image: NormalizedImage | null; options: VisualizerOptions }, isRetry = false) {
    // Duplicate-generation protection: a second Generate/Retry activation while
    // one attempt is already active must not start another — this single lock
    // guards BOTH actions, so Retry-while-Generating and Generate-while-Retrying
    // are blocked exactly like a Generate double-click (06-PHASE-RETRY.md §13/§26).
    // Checked synchronously via a ref (not state) so it also blocks a rapid
    // double-click, not just the disabled button.
    if (generationLockRef.current) return

    setGenerationStatus("validating")

    // Invalid input must never reach the generation boundary. This is the same
    // canonical Phase 3 validator, re-evaluated against current state — not a
    // second/duplicate validator. Retry revalidates the stored snapshot rather
    // than assuming "previously valid" still holds (06-PHASE-RETRY.md §20).
    const validation = validateVisualizerInput(candidate)
    if (!validation.valid || !validation.data) {
      if (isRetry) {
        // The live per-field error UI only reflects the CURRENT form, which may
        // differ from the retry snapshot being validated here — so an invalid
        // retry snapshot gets its own generic, non-field-scoped message
        // (06-PHASE-RETRY.md §21) rather than corrupting the live `errors` display.
        const error: GenerationError = { code: "VALIDATION_ERROR", message: "We couldn't retry this visualization. Please start a new visualization." }
        logVisualizerError(toGenerationAppError(error, null), { phase: "retry" })
        setGenerationError(error)
        setGenerationStatus("error")
      } else {
        setGenerationStatus("idle")
      }
      return
    }

    // Client-side quota short-circuit: only reached once the candidate is
    // otherwise valid, so upload/option errors still take priority. This is
    // purely a UX optimization (skip a wasted upload) — the server enforces the
    // real limit regardless, and the branch below (after the network call)
    // handles the case where this local state was stale.
    if (quotaState && !quotaState.canGenerate) {
      if (quotaState.phase === "needs_lead") {
        pendingCandidateRef.current = candidate
        setLeadDialogOpen(true)
        setGenerationStatus("idle")
        return
      }
      if (quotaState.phase === "cooldown") {
        setGenerationError({ code: "UNKNOWN_GENERATION_ERROR", message: formatCooldownMessage(quotaState.cooldownUntil) })
        setGenerationStatus("error")
        return
      }
    }

    generationLockRef.current = true
    setGenerationError(null)

    // A new attempt begins: the previous result is explicitly retired
    // (05-PHASE-RESULT.md §25, 06-PHASE-RETRY.md §10/§28-29) rather than left
    // lingering behind the loading state or misattributed to the new attempt.
    // Revoke its image URL first if a future real provider ever returns a
    // blob: URL (the current mock never does).
    if (resultImageUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(resultImageUrlRef.current)
    setGenerationResult(null)
    setResultError(null)
    setResultSnapshot(null)
    setResultImageLoadStatus("idle")

    // Every attempt — Generate or Retry — gets a brand-new request ID. Retry
    // must never reuse the previous requestId (06-PHASE-RETRY.md §9/§12).
    const requestId = createRequestId()
    activeRequestIdRef.current = requestId
    // Declared outside the try block (Phase 7, 07-PHASE-ERROR-RECOVERY.md §19)
    // so an unexpected failure can still preserve/report against it if it was
    // built before the failure occurred.
    let snapshot: VisualizationGenerationSnapshot | undefined

    // Phase 7 (§36-38, §58-59, ERR-005/ERR-015/ERR-021): everything from here
    // through response handling is wrapped so that a genuinely unexpected
    // exception — or the stale-response early return below — can NEVER leave
    // the duplicate-action lock stuck "true" or the UI stuck in "generating".
    // `runGeneration` already normalizes its own network/timeout/parse
    // failures into a normal response (never throws), so this catch exists as
    // defense-in-depth for truly unforeseen runtime errors, not as the primary
    // error path.
    try {
      snapshot = buildGenerationSnapshot(requestId, validation.data)

      setGenerationStatus("creating_request")
      setGenerationStatus("generating")

      const response = await runGeneration(snapshot)

      // Stale-response protection: if a newer attempt has since become active
      // (e.g. this attempt timed out client-side and the user started another,
      // via Generate or Retry), this response no longer belongs to anything on
      // screen — discard it without touching state, which the newer attempt now
      // owns. Same unmodified mechanism for both Generate and Retry
      // (06-PHASE-RETRY.md §12/§27 — do not weaken or duplicate it). The lock
      // is still released via `finally` below regardless of this early return.
      if (!shouldApplyGenerationResponse(activeRequestIdRef.current, response.requestId)) return

      // Regardless of outcome, this snapshot becomes the retry source of truth for
      // whatever the user is now looking at (06-PHASE-RETRY.md §8) — a failed or
      // timed-out attempt still needs a valid, current snapshot so Retry remains
      // available and uses the RIGHT (most recent) input, not a stale one.
      setRetrySnapshot(snapshot)

      // A quota denial is a distinct response kind (never part of the
      // success/timeout/error union above) — recognized and handled before
      // falling into that branching, same as generation-client.ts recognizes it
      // before normalizeProviderResult. This is the authoritative, server-side
      // enforcement path; the client-side pre-check above is only an optimization
      // and can be stale (e.g. another tab already used the last free slot).
      if (isQuotaDeniedResponse(response)) {
        if (response.phase === "needs_lead") {
          pendingCandidateRef.current = candidate
          setLeadDialogOpen(true)
          setGenerationStatus("idle")
        } else {
          const message = response.phase === "cooldown" ? formatCooldownMessage(response.cooldownUntil) : response.message
          setGenerationError({ code: "UNKNOWN_GENERATION_ERROR", message })
          setGenerationStatus("error")
        }
        setQuotaState((prev) => ({
          phase: response.phase === "cooldown" ? "cooldown" : response.phase === "needs_lead" ? "needs_lead" : (prev?.phase ?? "free"),
          canGenerate: false,
          freeRemaining: response.freeRemaining,
          cooldownUntil: response.cooldownUntil,
          hasLead: prev?.hasLead ?? response.phase !== "needs_lead",
        }))
        return
      }

      if (response.status === "success" && response.result) {
        // Phase 5 result validation (05-PHASE-RESULT.md §8 item 7 / §31): Phase 4's
        // normalizeProviderResult already guarantees a non-empty imageUrl string,
        // but not that it's a safe/usable reference for an <img> element. A
        // provider reporting "success" with an unusable reference must not reach
        // RESULT_READY — it is a result-layer failure, distinct from a
        // generation-layer failure (§24), even though it is shown the same way.
        if (!isUsableResultImageReference(response.result.imageUrl)) {
          const error: ResultError = { code: "RESULT_IMAGE_INVALID", message: RESULT_ERROR_MESSAGES.RESULT_IMAGE_INVALID }
          logVisualizerError(toResultAppError(error, requestId), { phase: isRetry ? "retry" : "generate" })
          setResultError(error)
          setGenerationStatus("error")
        } else {
          setGenerationResult({ requestId: response.requestId, imageUrl: response.result.imageUrl })
          setResultSnapshot(snapshot)
          setResultImageLoadStatus("loading")
          setGenerationStatus("success")
        }
      } else if (response.status === "timeout") {
        if (response.error) logVisualizerError(toGenerationAppError(response.error, requestId), { phase: isRetry ? "retry" : "generate" })
        setGenerationError(response.error)
        setGenerationStatus("timeout")
      } else {
        if (response.error) logVisualizerError(toGenerationAppError(response.error, requestId), { phase: isRetry ? "retry" : "generate" })
        setGenerationError(response.error)
        setGenerationStatus("error")
      }
    } catch (error) {
      // Preserve the last-known-good retry snapshot rather than inventing one:
      // if THIS attempt's snapshot was already built, it becomes the new retry
      // source; otherwise the prior attempt's snapshot (if any) is left intact
      // (07-PHASE-ERROR-RECOVERY.md §28-29 — do not destroy valid state on recovery).
      if (snapshot) setRetrySnapshot(snapshot)
      const appError = normalizeUnknownError(error, { requestId })
      logVisualizerError(appError, { phase: isRetry ? "retry" : "generate", cause: error })
      setGenerationError({ code: "UNKNOWN_GENERATION_ERROR", message: appError.message })
      setGenerationStatus("error")
    } finally {
      generationLockRef.current = false
      // Refresh from the server after every attempt (success, error, timeout, or
      // quota denial) so the banner reflects reality — this overrides the
      // optimistic client-side update above with the authoritative value.
      void refreshQuota()
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setHasAttemptedGenerate(true)
    await runGenerationAttempt({ image, options })
  }

  // Phase 6: Retry re-runs the exact same generation pipeline using the frozen
  // snapshot from the previous attempt — never the current live form state
  // (06-PHASE-RETRY.md §2/§11/§48). If no retry snapshot exists yet (the Retry
  // control is only ever rendered once one does), fail explicitly rather than
  // guessing at a replacement source (06-PHASE-RETRY.md §21).
  async function handleRetry() {
    if (!retrySnapshot) {
      const error: GenerationError = { code: "VALIDATION_ERROR", message: "We couldn't retry this visualization. Please start a new visualization." }
      logVisualizerError(toGenerationAppError(error, null), { phase: "retry" })
      setGenerationError(error)
      setGenerationStatus("error")
      return
    }
    await runGenerationAttempt({ image: retrySnapshot.image, options: retrySnapshot.options }, true)
  }

  // Phase 5: the browser's own <img> load lifecycle is a separate concern from
  // whether generation succeeded (05-PHASE-RESULT.md §12-13). A validated,
  // "usable" image reference can still fail to actually load (404, network
  // interruption, revoked/expired URL, unsupported format) — that must become a
  // visible result-display error, never a silently broken image.
  function handleResultImageLoad() {
    setResultImageLoadStatus("loaded")
  }

  function handleResultImageError() {
    setResultImageLoadStatus("error")
    const error: ResultError = { code: "RESULT_IMAGE_LOAD_FAILED", message: RESULT_ERROR_MESSAGES.RESULT_IMAGE_LOAD_FAILED }
    logVisualizerError(toResultAppError(error, generationResult?.requestId ?? null), { phase: "result-image" })
    setResultError(error)
  }

  return <main>
    <section className="bg-foreground text-background"><div className="container mx-auto px-6 py-20 lg:py-28"><p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent"><Sparkles className="h-4 w-4" />AI flooring visualizer</p><h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.05] text-balance md:text-7xl">Picture a new direction for your room.</h1><p className="mt-6 max-w-2xl leading-relaxed text-background/70">Upload a room photo, choose the look you like, and generate an AI-assisted visual concept of your space with new flooring. It's a visual concept to help you explore options — not an exact rendering, a guaranteed color match, or a construction-ready plan.</p></div></section>
    <section className="container mx-auto grid gap-14 px-6 py-20 lg:grid-cols-[1fr_.9fr] lg:py-28">
      <form onSubmit={submit} className="space-y-8">
        <div className="space-y-3">
          <label className="block border border-dashed border-border p-6">
            <span className="flex items-center gap-3 font-medium"><ImagePlus className="h-5 w-5 text-accent" />{image ? "Change photo" : "Upload a room photo"}</span>
            <span className="mt-2 block text-sm text-muted-foreground" aria-live="polite">
              {uploadStatus === "validating"
                ? "Checking your photo…"
                : image
                  ? `Selected: ${image.fileName} (${image.width}×${image.height})`
                  : "Your photo stays in this browser preview until you generate a visualization."}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-4 block w-full text-sm"
              onChange={handleImageSelected}
              disabled={uploadStatus === "validating" || loading}
              aria-describedby={uploadErrorMessage ? "visualizer-upload-error" : undefined}
              aria-invalid={uploadStatus === "validation_error"}
            />
          </label>
          {uploadErrorMessage && (
            <Alert id="visualizer-upload-error" variant="destructive">
              <AlertCircle />
              <AlertDescription>{uploadErrorMessage}</AlertDescription>
            </Alert>
          )}
          {errors.image && (
            <Alert id="visualizer-image-required-error" variant="destructive">
              <AlertCircle />
              <AlertDescription>{errors.image.message}</AlertDescription>
            </Alert>
          )}
        </div>
        <OptionButtons id="roomType" legend="Room type" options={ROOM_TYPE_OPTIONS} selected={options.roomType} onSelect={(value) => setOption("roomType", value)} error={errors.roomType?.message} disabled={loading} />
        <OptionButtons id="projectType" legend="Project type" options={PROJECT_TYPE_OPTIONS} selected={options.projectType} onSelect={(value) => setOption("projectType", value)} error={errors.projectType?.message} disabled={loading} />
        <OptionButtons id="preferredStyle" legend="Preferred style" options={PREFERRED_STYLE_OPTIONS} selected={options.preferredStyle} onSelect={(value) => setOption("preferredStyle", value)} error={errors.preferredStyle?.message} disabled={loading} />
        {options.preferredStyle === CUSTOM_STYLE_VALUE && (
          <div>
            <label htmlFor="customStyleDescription" className="block text-sm font-medium">
              Describe the style you want
            </label>
            <Textarea
              id="customStyleDescription"
              value={options.customStyleDescription}
              onChange={(event) => setOption("customStyleDescription", event.target.value)}
              placeholder="Warm medium-brown oak with a natural, matte finish"
              className="mt-3"
              disabled={loading}
              aria-invalid={!!errors.customStyleDescription}
              aria-describedby={errors.customStyleDescription ? "customStyleDescription-error" : undefined}
            />
            {errors.customStyleDescription && (
              <p id="customStyleDescription-error" role="alert" className="mt-2 text-sm text-destructive">
                {errors.customStyleDescription.message}
              </p>
            )}
          </div>
        )}
        <OptionButtons id="woodSpecies" legend="Wood species" options={WOOD_SPECIES_OPTIONS} selected={options.woodSpecies} onSelect={(value) => setOption("woodSpecies", value)} error={errors.woodSpecies?.message} disabled={loading} />
        <OptionButtons id="floorDirection" legend="Floor direction" options={FLOOR_DIRECTION_OPTIONS} selected={options.floorDirection} onSelect={(value) => setOption("floorDirection", value)} error={errors.floorDirection?.message} disabled={loading} />
        <OptionButtons id="finishPreference" legend="Finish preference" options={FINISH_PREFERENCE_OPTIONS} selected={options.finishPreference} onSelect={(value) => setOption("finishPreference", value)} error={errors.finishPreference?.message} disabled={loading} />
        <OptionButtons id="sheen" legend="Sheen" options={SHEEN_OPTIONS} selected={options.sheen} onSelect={(value) => setOption("sheen", value)} error={errors.sheen?.message} disabled={loading} />
        <OptionButtons id="serviceCity" legend="Service city (optional)" options={SERVICE_CITY_OPTIONS} selected={options.serviceCity} onSelect={(value) => setOption("serviceCity", value)} error={errors.serviceCity?.message} disabled={loading} />
        <div>
          <label htmlFor="squareFootage" className="block text-sm font-medium">
            Approximate square footage (optional)
            <input
              id="squareFootage"
              type="number"
              min="0"
              inputMode="numeric"
              onChange={(event) => setOption("squareFootage", normalizeSquareFootageInput(event.target.value))}
              className="mt-3 block w-full border border-input bg-background px-4 py-3"
              disabled={loading}
              aria-invalid={!!errors.squareFootage}
              aria-describedby={errors.squareFootage ? "squareFootage-error" : undefined}
            />
          </label>
          {errors.squareFootage && (
            <p id="squareFootage-error" role="alert" className="mt-2 text-sm text-destructive">
              {errors.squareFootage.message}
            </p>
          )}
        </div>
        {hasAttemptedGenerate && !inputValidation.valid && (
          <Alert id="visualizer-validation-summary" variant="destructive">
            <AlertCircle />
            <AlertDescription>{inputValidation.summary}</AlertDescription>
          </Alert>
        )}
        {(generationStatus === "error" || generationStatus === "timeout") && (generationError || resultError) && (
          <Alert id="visualizer-generation-error" variant="destructive" role="alert">
            <AlertCircle />
            <AlertDescription>{(generationError ?? resultError)!.message}</AlertDescription>
          </Alert>
        )}
        {quotaState && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {quotaState.phase === "free" && `${quotaState.freeRemaining} free visualization${quotaState.freeRemaining === 1 ? "" : "s"} remaining.`}
            {quotaState.phase === "needs_lead" && "You've used your free visualizations — share your contact info to unlock 1 more."}
            {quotaState.phase === "bonus" && "You have 1 more free visualization available."}
            {quotaState.phase === "rolling" && "You have 1 free visualization available today."}
            {quotaState.phase === "cooldown" && formatCooldownMessage(quotaState.cooldownUntil)}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            aria-describedby={hasAttemptedGenerate && !inputValidation.valid ? "visualizer-validation-summary" : undefined}
            aria-busy={loading}
            className="inline-flex items-center gap-2 bg-foreground px-7 py-4 font-medium text-background disabled:opacity-50"
          >
            {loading && <Spinner className="text-background" />}
            {loading ? "Creating your floor visualization…" : "Create my floor visualization"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
          {/* Phase 6: only rendered once a retryable attempt exists (06-PHASE-RETRY.md
              §11 — Retry Eligibility). Shares the exact same loading/lock state as
              Generate, so it is disabled during ANY active attempt, whether started
              by Generate or by Retry itself. */}
          {retrySnapshot && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              aria-busy={loading}
              className="inline-flex items-center gap-2 border border-foreground px-6 py-4 font-medium disabled:opacity-50"
            >
              {loading && <Spinner />}
              Retry visualization
            </button>
          )}
        </div>
        <p aria-live="polite" className="sr-only">
          {generationStatus === "generating" && "Creating your floor visualization, please wait."}
          {generationStatus === "success" && resultImageLoadStatus === "loading" && "Preparing your visualization for display."}
          {generationStatus === "success" && resultImageLoadStatus === "loaded" && "Your floor visualization is ready and visible."}
          {resultImageLoadStatus === "error" && "The visualization was generated, but it could not be displayed."}
          {generationStatus === "error" && resultImageLoadStatus !== "error" && "Visualization failed."}
          {generationStatus === "timeout" && "Visualization timed out."}
        </p>
      </form>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        {/* Phase 5: the generated result is the primary image once one exists and has
            loaded; the source photo remains visible as a small labeled thumbnail below
            so the user can still see "Original photo -> Generated visualization"
            without a full before/after slider (05-PHASE-RESULT.md §18, not required). */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {generationStatus === "success" && generationResult && resultImageLoadStatus !== "error" ? (
            <img
              key={generationResult.requestId}
              src={generationResult.imageUrl}
              alt={buildResultAltText(resultSnapshot?.options ?? null)}
              onLoad={handleResultImageLoad}
              onError={handleResultImageError}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity ${resultImageLoadStatus === "loaded" ? "opacity-100" : "opacity-0"}`}
            />
          ) : resultImageLoadStatus === "error" ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-10 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
              <span>Result could not be displayed. Your photo and selections are still saved below.</span>
            </div>
          ) : image ? (
            <img src={image.previewUrl} alt="Preview of your uploaded room photo" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-10 text-center text-sm text-muted-foreground">Upload a room photo to preview your space here.</div>
          )}
          {generationStatus !== "success" && resultImageLoadStatus !== "error" && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 opacity-75"
              style={{ backgroundColor: (options.preferredStyle && swatches[options.preferredStyle]) ?? "#9a633d", backgroundImage: "repeating-linear-gradient(90deg, transparent 0 34px, rgba(40,25,15,.3) 35px 38px)" }}
            />
          )}
          <div className="absolute left-4 top-4 bg-background/90 px-3 py-2 text-xs uppercase tracking-[0.16em]">
            {generationStatus === "success" && resultImageLoadStatus !== "error" ? "Generated visualization" : resultImageLoadStatus === "error" ? "Display error" : "Approximate color preview"}
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <span className="flex items-center gap-2 bg-background px-4 py-2 text-sm font-medium shadow">
                <Spinner />
                Creating your floor visualization…
              </span>
            </div>
          )}
          {generationStatus === "success" && resultImageLoadStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <span className="flex items-center gap-2 bg-background px-4 py-2 text-sm font-medium shadow">
                <Spinner />
                Preparing your visualization…
              </span>
            </div>
          )}
        </div>
        {generationStatus === "success" && resultImageLoadStatus === "loaded" && generationResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-2 border-l-2 border-accent pl-5 text-sm leading-relaxed text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                Your visualization concept is ready. This is an AI-assisted concept to help you explore ideas — not an exact rendering, a guaranteed
                color match, or a construction-ready plan.
              </span>
            </div>
            {image && (
              <div className="flex items-center gap-3 pl-5">
                <img src={image.previewUrl} alt="Your original uploaded room photo, unchanged" className="h-14 w-20 shrink-0 rounded-sm border border-border object-cover" />
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Original photo</span>
              </div>
            )}
          </div>
        )}
        {resultImageLoadStatus === "error" && (
          <Alert className="mt-6" variant="destructive" role="alert">
            <AlertCircle />
            <AlertDescription>{resultError?.message ?? RESULT_ERROR_MESSAGES.RESULT_IMAGE_LOAD_FAILED}</AlertDescription>
          </Alert>
        )}
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Want a real sample in your lighting?
            {quotaState?.phase === "cooldown" && " Or, since today's free visualization is used up, talk with us now:"}
          </p>
          <Link href="/contact" className="mt-3 inline-flex items-center gap-2 font-medium">
            Talk with Peoria Hardwood Floors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </section>
    <LeadCaptureDialog
      open={leadDialogOpen}
      onOpenChange={(open) => {
        setLeadDialogOpen(open)
        if (!open) pendingCandidateRef.current = null
      }}
      onSuccess={(newQuotaState) => {
        setQuotaState(newQuotaState)
        setLeadDialogOpen(false)
        const candidate = pendingCandidateRef.current
        pendingCandidateRef.current = null
        if (candidate) void runGenerationAttempt(candidate)
      }}
    />
  </main>
}
