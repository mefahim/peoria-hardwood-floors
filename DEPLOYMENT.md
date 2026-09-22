# Deploying this app

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in ADMIN_PASSWORD at minimum
pnpm build
pnpm start
```

The app listens on port 3000 by default (`PORT` env var overrides this).

## Environment variables

See [.env.example](.env.example) for the full list. `ADMIN_PASSWORD` and
`VISITOR_COOKIE_SECRET` are both required to run the app at all — the first
protects `/admin`, the second signs the anonymous visitor cookie the
generation-quota system uses (without it, `/api/visualizer` and `/api/lead`
fail closed with a 503 rather than silently trusting an unsigned cookie).
Generate it the same way as the admin password: `openssl rand -hex 32`.
`HF_TOKEN` is only needed if you want real AI-generated visualizations instead
of the free mock placeholder — and it can also be set later from `/admin`
itself, no redeploy needed.

If the real (Hugging Face) provider is active, set
`NEXT_PUBLIC_VISUALIZER_GENERATION_TIMEOUT_MS` generously (240000 = 4 minutes
is the recommended default) so slow generations get more time to finish for
real instead of falling back to the placeholder image. If a generation is
still running when this deadline passes, the visitor sees an instant fallback
placeholder — they never see an error — but the real failure/timeout is still
logged for the `/admin` warning banner.

## Important: this app needs a persistent filesystem

The `/admin` dashboard's provider/credential settings are still plain files
under `data/`. Leads, generation records, and quota state live in a real
SQLite database at `data/visualizer.db` (via `Node.js built-in SQLite`) — either way,
the app needs to run somewhere with a **writable, persistent disk that
survives between requests**.

`Node.js built-in SQLite` is a native module. It ships prebuilt binaries for common
platforms (no compiler needed on a normal Linux x64 host), but **confirm the
host's Node.js version is 22 or newer** before deploying — check with `node -v`
on the host; if it's older, downgrade the `Node.js built-in SQLite` version in
`package.json` to an older major that supports it. After `pnpm install` on a
fresh host, if the native binding didn't load, run `pnpm rebuild
Node.js built-in SQLite` once (this repo's `package.json` already allowlists it via
`pnpm.onlyBuiltDependencies`, so a plain `pnpm install` should handle this
automatically — but verify).

The database runs in WAL mode, which creates `visualizer.db-wal` and
`visualizer.db-shm` sidecar files next to `visualizer.db`. Any backup script
must copy all three together (or use SQLite's own backup mechanism) — copying
only `visualizer.db` can produce an inconsistent snapshot.

**Works well on:** a VPS, Docker container, Railway, Render, Fly.io, or any
host running `next start` as a long-lived Node process with a normal
filesystem.

**Will NOT work correctly on default serverless deployments** (e.g. Vercel's
standard serverless functions, Netlify functions): their filesystem is
read-only or ephemeral per-invocation, so dashboard settings and saved images
would silently fail to persist or vanish between requests. If you specifically
want to deploy there, either:
- switch `data/` storage to a real database and `public/generated/` uploads
  to an object store (S3, R2, etc.) — a real change, not a config flag, or
- use that platform's "traditional server" / container mode instead of its
  default serverless functions, if it offers one.

## First run

On a fresh deploy, `data/` and `public/generated/` don't exist yet — the app
creates them automatically on first use (dashboard defaults to the free mock
provider until you set `HF_TOKEN` and switch providers from `/admin`).

## Generation quota & lead capture

`/visualizer` allows 2 free generations per anonymous visitor (tracked via a
signed, httpOnly cookie + server-side database — not localStorage, not a
simple cookie value, and never trusted from the client), then requires a
name/email (phone optional) before allowing 1 more, then enforces a 24-hour
rolling limit. This is enforced entirely server-side and is **not** a
guarantee against a determined individual clearing cookies, using a private
window, or switching devices — those still reset to a fresh visitor and fresh
quota, by design (no login/OTP/CAPTCHA is required of normal users). Layered,
informational abuse signals (IP-based rate limiting, cross-session email/IP
flagging) are visible at `/admin/generations`, and an admin can manually block
a visitor from there or from a lead's detail page — that's the actual
enforcement lever for a confirmed bad actor, not automatic hard-blocking.

## Known non-blocking items

- Next.js 16 shows a deprecation warning for the `middleware.ts` convention
  (it recommends renaming to `proxy.ts`). It still works correctly — this is
  just a heads-up for a future cleanup, not something blocking deployment.
