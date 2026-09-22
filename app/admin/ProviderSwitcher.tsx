"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const PROVIDER_LABELS: Record<string, string> = {
  mock: "Mock (free placeholder image, for testing)",
  huggingface: "Hugging Face / fal.ai (real AI generation, uses credits)",
}

export function ProviderSwitcher({ current, options }: { current: string; options: readonly string[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState(current)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSavedMessage(null)
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selected }),
      })
      if (!res.ok) throw new Error("Failed to save.")
      setSavedMessage(`Active provider is now: ${PROVIDER_LABELS[selected] ?? selected}`)
      router.refresh()
    } catch {
      setSavedMessage("Could not save — please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-3 border border-border px-4 py-3">
          <input type="radio" name="provider" value={option} checked={selected === option} onChange={() => setSelected(option)} />
          <span>{PROVIDER_LABELS[option] ?? option}</span>
        </label>
      ))}
      <button
        type="button"
        onClick={save}
        disabled={saving || selected === current}
        className="bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {savedMessage && <p className="text-sm text-muted-foreground">{savedMessage}</p>}
    </div>
  )
}
