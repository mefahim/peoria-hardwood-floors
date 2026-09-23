import { authorizeDashboardAccess, getCurrentDashboardPrincipal } from "@/lib/admin/authorization"
import { filterHistory, getPhase07Snapshot, saveReview, validateReviewMutation } from "@/lib/seo/phase07"

function response(data: unknown, status = 200) { return Response.json({ ok: status < 400, data }, { status }) }
function error(message: string, status = 400, code = "VALIDATION_FAILED") { return Response.json({ ok: false, errors: [{ code, message }] }, { status }) }
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (!origin) return true; try { return new URL(origin).origin === new URL(request.url).origin } catch { return false } }
async function principal() { return getCurrentDashboardPrincipal() }

export async function GET(request: Request) {
  const current = await principal()
  if (!authorizeDashboardAccess(current, "view", "seo-dashboard")) return error("Authentication required.", 401, "AUTH_REQUIRED")
  const url = new URL(request.url)
  const snapshot = await getPhase07Snapshot()
  if (url.searchParams.get("view") === "history") return response({ history: filterHistory(snapshot.history, Object.fromEntries(["entity", "action", "actor", "source", "search", "from", "to", "page", "pageSize"].map((key) => [key, url.searchParams.get(key) ?? undefined]))) })
  return response({ ...snapshot, role: current.role })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return error("Request origin is not allowed.", 403, "CSRF_REJECTED")
  const current = await principal()
  if (!authorizeDashboardAccess(current, "review", "seo-dashboard")) return error("Review permission is required.", 403, "FORBIDDEN")
  let body: unknown
  try { body = await request.json() } catch { return error("Invalid request body.") }
  const parsed = validateReviewMutation(body)
  if (parsed.error || !parsed.kind || !parsed.id || !parsed.state) return error(parsed.error ?? "Invalid review mutation.")
  const result = await saveReview(parsed.kind, parsed.id, parsed.state, current.role ?? "Admin")
  return response({ review: result })
}
