import { authorizeDashboardAccess, getCurrentDashboardPrincipal } from "@/lib/admin/authorization"
import { getManagedSeoEntity, getSeoChangeHistory, listManagedSeoEntities, resetSeoOverride, saveSeoOverride, validateMutationPayload } from "@/lib/seo/management"

function mutationResponse(data: unknown, status = 200) { return Response.json({ ok: status < 400, data, approvalRequired: false }, { status }) }
function errorResponse(code: string, message: string, status: number) { return Response.json({ ok: false, errors: [{ code, message }], approvalRequired: false }, { status }) }
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true
  try { return new URL(origin).origin === new URL(request.url).origin } catch { return false }
}
async function canView() { const principal = await getCurrentDashboardPrincipal(); return { principal, allowed: authorizeDashboardAccess(principal, "view", "seo-dashboard") } }

export async function GET(request: Request) {
  const { principal, allowed } = await canView()
  if (!allowed) return errorResponse("AUTH_REQUIRED", "Authentication required.", 401)
  const url = new URL(request.url)
  if (url.searchParams.get("history") === "true") return mutationResponse({ history: await getSeoChangeHistory() })
  const route = url.searchParams.get("route")
  if (route) {
    const entity = await getManagedSeoEntity(route)
    return entity ? mutationResponse({ entity }) : errorResponse("UNKNOWN_ROUTE", "Unknown or protected route.", 404)
  }
  return mutationResponse({ entities: await listManagedSeoEntities(), role: principal.role })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorResponse("CSRF_REJECTED", "Request origin is not allowed.", 403)
  const principal = await getCurrentDashboardPrincipal()
  if (!authorizeDashboardAccess(principal, "update", "seo-dashboard")) return errorResponse("FORBIDDEN", "SEO updates require Admin or SEO Manager access.", 403)
  let body: unknown
  try { body = await request.json() } catch { return errorResponse("VALIDATION_FAILED", "Invalid request body.", 400) }
  const parsed = validateMutationPayload(body)
  if (parsed.error) return errorResponse(parsed.error.includes("Unknown") ? "UNKNOWN_ROUTE" : "VALIDATION_FAILED", parsed.error, 400)
  const entity = await getManagedSeoEntity(parsed.route)
  if (!entity) return errorResponse("UNKNOWN_ROUTE", "Unknown or protected route.", 404)
  if (parsed.action === "reset") await resetSeoOverride(parsed.route, principal.role ?? "Admin")
  else await saveSeoOverride(parsed.route, parsed.fields ?? {}, principal.role ?? "Admin")
  return mutationResponse({ entity: await getManagedSeoEntity(parsed.route), action: parsed.action })
}
