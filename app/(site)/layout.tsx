// Public marketing site chrome (fixed header + footer) — scoped to this route
// group only, via app/(site) (a route group: the parentheses are excluded from
// the URL, so every existing path like /about, /services, /visualizer is
// unchanged). Deliberately NOT in the root layout — /admin/* is a sibling
// route group that must never show the public nav/phone-CTA/footer, which it
// previously did (the root layout used to render SiteHeader unconditionally
// for every route, including /admin, where its `fixed` positioning visually
// collided with the admin dashboard's own header).

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
    </>
  )
}
