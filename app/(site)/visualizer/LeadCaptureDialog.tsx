"use client"

// Gate shown after 2 free generations: name + email (required), phone (optional).
// No OTP, no CAPTCHA — matches the house style of LoginForm.tsx (plain useState +
// fetch, not react-hook-form) and the requirement to keep this simple/low-friction.

import { useState } from "react"
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { validateLeadForm, type LeadValidationErrors } from "@/lib/visualizer/lead-validation"
import type { VisitorQuotaStatus } from "@/lib/visualizer/quota-types"

interface LeadCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (quotaState: VisitorQuotaStatus) => void
}

export function LeadCaptureDialog({ open, onOpenChange, onSuccess }: LeadCaptureDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<LeadValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    const validation = validateLeadForm({ name, email, phone })
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.ok) {
        if (body?.errors) setErrors(body.errors)
        else setSubmitError("Something went wrong — please try again.")
        setLoading(false)
        return
      }
      setLoading(false)
      onSuccess(body.quotaState)
    } catch {
      setSubmitError("Something went wrong — please try again.")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>One more free visualization</DialogTitle>
          <DialogDescription>Share your contact info and we'll unlock one more AI visualization — no account, no verification needed.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Name</Label>
            <Input id="lead-name" value={name} onChange={(event) => setName(event.target.value)} disabled={loading} aria-invalid={!!errors.name} autoFocus />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email">Email</Label>
            <Input id="lead-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone">Phone (optional)</Label>
            <Input id="lead-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading} aria-invalid={!!errors.phone} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          {submitError && (
            <Alert variant="destructive" role="alert">
              <AlertCircle />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? <Spinner className="text-background" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Submitting..." : "Unlock 1 more visualization"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
