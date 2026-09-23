"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Activity, FileText, History, ImageIcon, Link2, MapPinned, Menu, SearchCheck, Settings2, Users, WandSparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type MobileItem = { href: string; label: string }

const ICONS = [SearchCheck, Users, WandSparkles, FileText, Activity, Settings2, MapPinned, FileText, Link2, ImageIcon, History]

export function MobileAdminNav({ active, workspace, seo }: { active: string; workspace: MobileItem[]; seo: MobileItem[] }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    navRef.current?.querySelector<HTMLElement>("a")?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  function isWorkspaceActive(item: MobileItem) { return item.href === "/admin" ? active === "/admin" : item.href === active }

  return <div className="md:hidden"><Button ref={triggerRef} type="button" variant="ghost" size="icon" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-admin-navigation" onClick={() => setOpen((value) => !value)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button>{open && <><button type="button" className="fixed inset-0 z-40 cursor-default bg-black/30" aria-label="Close navigation" onClick={() => { setOpen(false); triggerRef.current?.focus() }} /><nav ref={navRef} id="mobile-admin-navigation" className="absolute left-4 top-14 z-50 max-h-[calc(100vh-5rem)] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-xl" aria-label="Mobile admin navigation"><div className="border-b border-sidebar-border px-3 pb-3"><p className="font-serif text-base">Peoria Hardwood Floors</p><p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50">Operations Console</p></div><p className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">Workspace</p><div className="space-y-1">{workspace.map((item, index) => { const Icon = ICONS[index] ?? SearchCheck; const isActive = isWorkspaceActive(item); return <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} onClick={() => setOpen(false)} className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "bg-background text-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}><Icon className="h-4 w-4" aria-hidden="true" /><span>{item.label}</span>{isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}</Link>})}</div><p className="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">SEO workspace</p><div className="space-y-1">{seo.map((item, index) => { const Icon = ICONS[index + workspace.length] ?? Activity; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:bg-sidebar-accent hover:text-sidebar-foreground"><Icon className="h-4 w-4" aria-hidden="true" /><span>{item.label}</span></Link>})}</div></nav></>}</div>
}
