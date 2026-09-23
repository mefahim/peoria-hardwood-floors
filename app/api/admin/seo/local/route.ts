import { authorizeDashboardAccess, getCurrentDashboardPrincipal } from "@/lib/admin/authorization"
import { getLocalSnapshot, saveBusinessPending, saveCaseStudy, saveLocalRecord, validateBusinessPending, validateCaseStudyInput, validateLocalRecord } from "@/lib/seo/local-management"

function ok(data: unknown) { return Response.json({ ok: true, data, approvalRequired: false }) }
function fail(code: string, message: string, status: number) { return Response.json({ ok: false, errors: [{ code, message }], approvalRequired: false }, { status }) }
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (!origin) return true; try { return new URL(origin).origin === new URL(request.url).origin } catch { return false } }

export async function GET(request: Request) {
  const principal = await getCurrentDashboardPrincipal()
  if (!authorizeDashboardAccess(principal, "view", "seo-dashboard")) return fail("AUTH_REQUIRED", "Authentication required.", 401)
  return ok({ snapshot: await getLocalSnapshot(), role: principal.role })
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("CSRF_REJECTED", "Request origin is not allowed.", 403)
  const principal = await getCurrentDashboardPrincipal()
  let body: unknown
  try { body = await request.json() } catch { return fail("VALIDATION_FAILED", "Invalid request body.", 400) }
  if (!body || typeof body !== "object") return fail("VALIDATION_FAILED", "Invalid local governance payload.", 400)
  const input = body as Record<string, unknown>
  if (input.action === "save-business-pending") {
    if (!authorizeDashboardAccess(principal, "governance-edit", "seo-dashboard")) return fail("FORBIDDEN", "Business editing is not permitted for this role.", 403)
    const parsed = validateBusinessPending(input.fields)
    if (parsed.error || !parsed.value) return fail("VALIDATION_FAILED", parsed.error ?? "Invalid business fields.", 400)
    return ok({ businessPending: await saveBusinessPending(parsed.value, principal.role ?? "Admin") })
  }
  if (input.action === "save-local") {
    if (!authorizeDashboardAccess(principal, "governance-edit", "seo-dashboard")) return fail("FORBIDDEN", "Local SEO editing is not permitted for this role.", 403)
    const parsed = validateLocalRecord(input.record)
    if (parsed.error || !parsed.value) return fail("VALIDATION_FAILED", parsed.error ?? "Invalid local record.", 400)
    if (parsed.value.verificationState === "verified") return fail("VERIFICATION_REQUIRED", "Dashboard input cannot self-verify a location. Human evidence review is required.", 403)
    return ok({ record: await saveLocalRecord(parsed.value, principal.role ?? "Admin") })
  }
  if (input.action === "save-case-study") {
    if (!authorizeDashboardAccess(principal, "governance-edit", "seo-dashboard")) return fail("FORBIDDEN", "Case-study editing is not permitted for this role.", 403)
    const parsed = validateCaseStudyInput(input.record)
    if (parsed.error || !parsed.value) return fail("VALIDATION_FAILED", parsed.error ?? "Invalid case-study record.", 400)
    const critical = (parsed.issues ?? []).filter((issue) => issue.severity === "critical")
    if (parsed.value.publicationStatus === "approved" && critical.length > 0) return fail("APPROVAL_REQUIRED", "Case study requires verified evidence and human approval before approval.", 400)
    if (parsed.value.publicationStatus === "published") return fail("PROTECTED_RULE", "Phase 06 does not publish case studies from the dashboard.", 403)
    return ok({ caseStudy: await saveCaseStudy(parsed.value, principal.role ?? "Admin"), issues: parsed.issues ?? [] })
  }
  return fail("VALIDATION_FAILED", "Unknown local governance action.", 400)
}
