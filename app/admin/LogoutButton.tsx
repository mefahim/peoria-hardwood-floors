"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={logout} className="gap-2">
      <LogOut className="h-3.5 w-3.5" />
      Log out
    </Button>
  )
}
