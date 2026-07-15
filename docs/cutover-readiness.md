# Production cutover readiness

This document is the human-reviewed checklist for switching the production domain
from the existing React Router application to this TanStack Start rewrite. It
covers PRD user stories 48–58 and issue #11.

Cutover does **not** modify or retire the React Router repository or its
deployment (US 58). That application stays live and unchanged until a separate,
later decision retires it.

Boxes marked **HITL** require explicit human approval and cannot be checked by
automation. Boxes marked **auto** are backed by an automated check or script
described below.

## 1. Automated verification (US 57)

Run the full suite against the non-production environment. All must pass:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run check` (formatting)
- [ ] `npm run test` (Vitest unit + integration)
- [ ] `npm run build` (production build)
- [ ] `npm run test:e2e` (Playwright journeys, incl. accessibility) — needs a
      seeded non-production DB + `SEED_ADMIN_PASSWORD` and Resend config.

`npm run validate` chains check → lint → typecheck → test → build.

## 2. Read-only production compatibility (US 51, auto)

Confirms the Prisma schema and expected portfolio data are compatible **without
mutating production**. Every query is a connectivity probe, a count, or an
existence read.

```
npm run db:check
```

It reports pass/warn/fail for: required models present, `admin` role present, an
Administrator that can log in, the Homepage singleton, portfolio data present,
and at least one publicly visible Painting. It exits non-zero if any check
fails. Logic is unit-tested in `src/features/cutover/cutover.test.ts`.

- [ ] `npm run db:check` reports **READY** against the production database.

## 3. Environment configuration and secrets (US 54, 55; auto + HITL)

- [ ] Every variable in `.env.example` is set in the production Vercel project:
      `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` (≥32 chars, freshly
      generated), `RESEND_API_KEY`, `ARTIST_EMAIL`, `EMAIL_FROM`,
      `ALLOW_INDEXING=true`.
- [ ] `NODE_ENV=production` so the session cookie is issued `Secure`.
- [ ] **No secrets are committed.** `.env` is git-ignored; `.env.example`
      contains only placeholders; the sanitized seed carries no reusable
      credential (US 50). Verify with a history scan before switching the
      domain.
- [ ] Environment variables are validated at startup by `src/server/env.ts`;
      missing DB/session/email/indexing config fails clearly (US 54).

## 4. Route, data, email, image, SEO, and 404 parity (auto + HITL)

Automation covers each item; a human confirms parity on the deployed app.

- [ ] Public routes: `/`, `/paintings`, `/paintings/:id`, `/contact-me`.
- [ ] Query params: `/paintings?q=<categoryId>` (valid, unknown, deleted) and
      `/contact-me?q=<paintingId>` (valid, stale).
- [ ] Image resource URLs resolve with immutable cache headers; only
      JPEG/PNG/WebP are accepted; SVG/unknown are rejected.
- [ ] Contact delivery: Artist notification determines success; visitor
      auto-reply is best effort.
- [ ] Authentication: login, logout, anonymous redirect, non-admin forbidden,
      `:username` mismatch → 404.
- [ ] Administration: Painting/Category/Homepage read and CRUD.
- [ ] SEO: `/sitemap.xml` (public-only), `/robots.txt` (policy-aware),
      login + Administration marked non-indexable.
- [ ] Unknown route and missing Painting render the branded 404 at status 404;
      failures render the safe error boundary with no leaked secrets.

## 5. Visual parity (US 57; HITL)

- [ ] **HITL** A human approves public and Administration visual parity across
      supported mobile and desktop viewports.

## 6. No obsolete Epic Stack surface (HITL)

- [ ] No Epic Stack template route or UI is exposed: no `/forgot-password`,
      `/verify`, `/reset-password`, `/tos`, `/me`, onboarding, 2FA, or profile
      routes; the dead "Forgot password?" link is gone.

## 7. Headers, cookies, indexing, and cache (HITL, on the deployed app)

- [ ] Session cookie is `HttpOnly`, `SameSite=Lax`, `Secure`, `Path=/`
      (`src/features/auth/auth.ts`).
- [ ] `ALLOW_INDEXING=true` in production; previews/dev block indexing.
- [ ] Public images send `Cache-Control: public, max-age=31536000, immutable`;
      SEO endpoints send `public, max-age=3600`.
- [ ] Security headers are present on the deployed responses.

## 8. Accepted launch risks (US 52 note; HITL acknowledgement)

Rate limiting is intentionally deferred (PRD "Out of Scope"). Abuse protection
on login and Contact is **honeypot-only**.

- [ ] **HITL** The stakeholder explicitly acknowledges that honeypot-only abuse
      protection and the absence of application/provider rate limiting are
      accepted risks at launch, with brute-force and submission-flood exposure
      understood. Adding rate limiting is a deferred improvement.

## 9. Session cutover procedure (US 48; auto)

Executed in order at cutover so the new deployment begins with fresh
authentication:

1. [ ] Set a freshly generated `SESSION_SECRET` (≥32 chars) in production,
       distinct from any previous value. Rotating the secret invalidates every
       previously issued signed cookie. (`isSessionSecretRotated` documents the
       rule.)
2. [ ] Invalidate every existing database Session so no backing row survives:

   ```
   npm run db:cutover-sessions -- --confirm
   ```

   This deletes all `Session` rows and touches no portfolio content. Without
   `--confirm` it refuses to run.

3. [ ] Confirm the Administrator can complete a fresh login afterward.

## 10. Final approval (HITL)

- [ ] The React Router application and deployment remain unchanged (US 58).
- [ ] **HITL** A human gives explicit approval before the production domain is
      switched to this deployment.
