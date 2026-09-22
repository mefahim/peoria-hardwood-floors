// No existing IP-extraction utility in the repo. x-forwarded-for is attacker-
// controllable unless the deployment's reverse proxy overwrites (not appends) it —
// this is a flood/abuse-signal input, not an authentication boundary, so that's an
// acceptable, documented limitation (see DEPLOYMENT.md).
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}
