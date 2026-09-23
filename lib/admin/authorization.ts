import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_SESSION_COOKIE, isValidSessionCookie } from "@/lib/visualizer/admin-auth"

export const DASHBOARD_ROLES = ["Admin", "SEO Manager", "Content Editor", "Reviewer"] as const
export type DashboardRole = (typeof DASHBOARD_ROLES)[number]

export const DASHBOARD_ACTIONS = ["view", "update"] as const
export type DashboardAction = (typeof DASHBOARD_ACTIONS)[number]

export const DASHBOARD_RESOURCES = ["seo-dashboard"] as const
export type DashboardResource = (typeof DASHBOARD_RESOURCES)[number]

const ROLE_PERMISSIONS: Record<DashboardRole, readonly `${DashboardAction}:${DashboardResource}`[]> = {
  Admin: ["view:seo-dashboard", "update:seo-dashboard"],
  "SEO Manager": ["view:seo-dashboard", "update:seo-dashboard"],
  "Content Editor": ["view:seo-dashboard"],
  Reviewer: ["view:seo-dashboard"],
}

export type DashboardPrincipal = {
  authenticated: boolean
  role: DashboardRole | null
}

export function isDashboardRole(value: string | null | undefined): value is DashboardRole {
  return Boolean(value && (DASHBOARD_ROLES as readonly string[]).includes(value))
}

export function authorizeDashboardAccess(
  principal: DashboardPrincipal,
  action: DashboardAction,
  resource: DashboardResource,
): boolean {
  if (!principal.authenticated || !principal.role) return false
  if (!isDashboardRole(principal.role)) return false
  return ROLE_PERMISSIONS[principal.role].includes(`${action}:${resource}`)
}

/**
 * The current application has one authenticated admin principal, not a persisted
 * multi-role identity store. Map the existing session to Admin only; do not
 * infer future roles from client input, query parameters, or local storage.
 */
export async function getCurrentDashboardPrincipal(): Promise<DashboardPrincipal> {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const authenticated = await isValidSessionCookie(session)
  return { authenticated, role: authenticated ? "Admin" : null }
}

export async function requireSeoDashboardAccess(): Promise<DashboardPrincipal> {
  const principal = await getCurrentDashboardPrincipal()
  if (!authorizeDashboardAccess(principal, "view", "seo-dashboard")) {
    redirect("/admin/login?next=/admin/seo")
  }
  return principal
}
