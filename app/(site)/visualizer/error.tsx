"use client"

// Phase 7 — Error Recovery (visualizer-docs/07-PHASE-ERROR-RECOVERY.md §32-33)
// Next.js App Router error boundary, scoped to exactly the Visualizer route
// segment (app/visualizer/**) rather than the whole application (§33) — this
// reuses the framework's own error-boundary mechanism instead of hand-rolling
// a second one. It only ever catches unexpected rendering/lifecycle
// exceptions; every EXPECTED failure (upload, validation, generation, timeout,
// result) is already handled inside app/visualizer/page.tsx and never reaches
// this boundary.

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { logVisualizerError, normalizeUnknownError } from "@/lib/visualizer/errors"

export default function VisualizerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logVisualizerError(normalizeUnknownError(error, { requestId: null }), { phase: "render", cause: error })
  }, [error])

  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 font-serif text-3xl">We hit an unexpected problem.</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Please reload the visualizer or start a new visualization.</p>
      <button type="button" onClick={reset} className="mt-6 inline-flex items-center gap-2 bg-foreground px-6 py-3 font-medium text-background">
        Reload visualizer
      </button>
    </main>
  )
}
