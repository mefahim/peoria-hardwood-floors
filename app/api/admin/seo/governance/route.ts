import { authorizeDashboardAccess, getCurrentDashboardPrincipal } from "@/lib/admin/authorization"
import { getGovernanceSnapshot, getBrief, getTopic, saveBrief, saveConflictState, saveTopic, validateBriefInput, validateTopicInput, type ConflictState } from "@/lib/seo/governance"

function ok(data: unknown) { return Response.json({ ok: true, data, approvalRequired: false }) }
function fail(code: string, message: string, status: number) { return Response.json({ ok: false, errors: [{ code, message }], approvalRequired: false }, { status }) }
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (!origin) return true; try { return new URL(origin).origin === new URL(request.url).origin } catch { return false } }
async function principal() { return getCurrentDashboardPrincipal() }

export async function GET(request: Request) {
  const user = await principal()
  if (!authorizeDashboardAccess(user, "view", "seo-dashboard")) return fail("AUTH_REQUIRED", "Authentication required.", 401)
  const url = new URL(request.url)
  const topicId = url.searchParams.get("topicId")
  const contentId = url.searchParams.get("contentId")
  if (topicId) { const topic = await getTopic(topicId); return topic ? ok({ topic }) : fail("UNKNOWN_TOPIC", "Unknown topic.", 404) }
  if (contentId) { const brief = await getBrief(contentId); return brief ? ok({ brief }) : fail("UNKNOWN_CONTENT", "Unknown content brief.", 404) }
  return ok({ snapshot: await getGovernanceSnapshot(), role: user.role })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("CSRF_REJECTED", "Request origin is not allowed.", 403)
  const user = await principal()
  let body: unknown
  try { body = await request.json() } catch { return fail("VALIDATION_FAILED", "Invalid request body.", 400) }
  if (!body || typeof body !== "object") return fail("VALIDATION_FAILED", "Invalid governance payload.", 400)
  const input = body as Record<string, unknown>
  if (input.action === "save-topic") {
    if (!authorizeDashboardAccess(user, "governance-edit", "seo-dashboard")) return fail("FORBIDDEN", "Topic editing is not permitted for this role.", 403)
    const parsed = validateTopicInput(input.topic)
    if (parsed.error || !parsed.value) return fail("VALIDATION_FAILED", parsed.error ?? "Invalid topic.", 400)
    const existing = await getTopic(parsed.value.topicId)
    if (existing?.source === "Existing/code-defined") return fail("PROTECTED_RULE", "Code-defined topics are read-only.", 409)
    return ok({ topic: await saveTopic(parsed.value, user.role ?? "Admin") })
  }
  if (input.action === "save-brief") {
    if (!authorizeDashboardAccess(user, "governance-edit", "seo-dashboard")) return fail("FORBIDDEN", "Brief editing is not permitted for this role.", 403)
    const raw = input.brief
    const contentId = raw && typeof raw === "object" && typeof (raw as Record<string, unknown>).contentId === "string" ? String((raw as Record<string, unknown>).contentId) : undefined
    const parsed = validateBriefInput(raw, contentId)
    if (parsed.error || !parsed.value) return fail("VALIDATION_FAILED", parsed.error ?? "Invalid content brief.", 400)
    const critical = (parsed.issues ?? []).filter((issue) => issue.severity === "critical")
    if (parsed.value.status === "PUBLISHED") return fail("PROTECTED_RULE", "Phase 05 does not publish content.", 403)
    if (parsed.value.status === "APPROVED" && (!parsed.value.humanApproval || critical.length > 0)) return fail("APPROVAL_REQUIRED", "A brief requires human approval, clear URL/evidence validation, and no critical governance issues before approval.", 400)
    return ok({ brief: await saveBrief(parsed.value, user.role ?? "Admin"), issues: parsed.issues ?? [] })
  }
  if (input.action === "update-conflict") {
    if (!authorizeDashboardAccess(user, "review", "seo-dashboard")) return fail("FORBIDDEN", "Cannibalization review is not permitted for this role.", 403)
    if (typeof input.id !== "string" || !["FLAG", "REVIEW", "DECIDE"].includes(String(input.state))) return fail("VALIDATION_FAILED", "Conflict ID and a valid review state are required.", 400)
    const snapshot = await getGovernanceSnapshot()
    if (!snapshot.conflicts.some((conflict) => conflict.id === input.id)) return fail("UNKNOWN_CONFLICT", "Unknown cannibalization conflict.", 404)
    const current = snapshot.conflicts.find((conflict) => conflict.id === input.id)?.conflictStatus ?? "FLAG"
    const next = String(input.state) as ConflictState
    const order = ["FLAG", "REVIEW", "DECIDE"]
    if (order.indexOf(next) < order.indexOf(current)) return fail("INVALID_STATUS_TRANSITION", "Conflict review state cannot move backwards.", 400)
    return ok({ id: input.id, conflictStatus: await saveConflictState(input.id, next, user.role ?? "Admin") })
  }
  return fail("VALIDATION_FAILED", "Unknown governance action.", 400)
}
