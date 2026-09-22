"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function CredentialEditor({
  configured,
  source,
  masked,
}: {
  configured: boolean
  source: "dashboard" | "env" | "none"
  masked: string | null
}) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    if (!value.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hfToken: value.trim() }),
      })
      if (!res.ok) throw new Error("Failed to save.")
      setValue("")
      setMessage("Saved. This token will be used for the next generation.")
      router.refresh()
    } catch {
      setMessage("Could not save — please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {configured ? (
          <>
            Currently set: <span className="font-mono">{masked}</span> ({source === "dashboard" ? "set from this dashboard" : "from .env.local"})
          </>
        ) : (
          "No Hugging Face token is configured yet."
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="hf_..."
          className="min-w-0 flex-1 border border-input bg-background px-4 py-2.5 text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || !value.trim()}
          className="shrink-0 bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
