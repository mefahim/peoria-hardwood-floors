"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Phone, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { primaryNav, site } from "@/lib/site"
import { Logo } from "@/components/logo"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open ? "bg-background/90 backdrop-blur-md border-b border-border" : "bg-transparent",
      )}
    >
      <nav className="container mx-auto flex items-center justify-between gap-6 px-5 py-5 sm:px-6 lg:py-6">
        <Link href="/" aria-label={`${site.name} home`}>
          <Logo
            className={cn(
              "h-14 w-[280px] transition-all duration-300 sm:h-16 sm:w-[320px]",
              scrolled || open ? "text-foreground" : "text-white",
            )}
          />
        </Link>

        <ul className="hidden items-center gap-6 text-[0.72rem] font-medium uppercase tracking-[0.16em] xl:flex">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative py-1 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full",
                    scrolled || open ? "text-foreground/80 hover:text-foreground" : "text-white/85 hover:text-white",
                    active && "after:w-full",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden items-center gap-4 xl:flex">
          <a
            href={site.phoneHref}
            className={cn(
              "inline-flex items-center gap-2 border px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-300",
              scrolled || open
                ? "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground"
                : "border-white bg-white text-foreground hover:bg-transparent hover:text-white",
            )}
          >
            <Phone className="h-4 w-4" />
            {site.phone}
          </a>
        </div>

        <button
          type="button"
          className={cn("xl:hidden", scrolled || open ? "text-foreground" : "text-white")}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background transition-all duration-300 xl:hidden",
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <ul className="container mx-auto flex flex-col gap-1 px-6 py-6">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block border-b border-border py-3 font-serif text-2xl text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="pt-4">
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-sm font-medium text-background"
            >
              <Phone className="h-4 w-4" />
              Call {site.phone}
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
