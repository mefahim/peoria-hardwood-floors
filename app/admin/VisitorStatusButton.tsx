"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function VisitorStatusButton({ visitorId, currentStatus }: { visitorId: string; currentStatus: "active" | "flagged" | "blocked" }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function setStatus(status: "active" | "blocked") {
    setSaving(true)
    try {
      await fetch("/api/admin/visitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, status }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (currentStatus === "blocked") {
    return (
      <button type="button" onClick={() => setStatus("active")} disabled={saving} className="border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50">
        {saving ? "Saving..." : "Unblock"}
      </button>
    )
  }

  return (
    <button type="button" onClick={() => setStatus("blocked")} disabled={saving} className="border border-destructive px-3 py-1.5 text-xs font-medium text-destructive disabled:opacity-50">
      {saving ? "Saving..." : "Block visitor"}
    </button>
  )
}
