# Art by Vero Miller TanStack Start Rewrite PRD

## Problem Statement

The current Art by Vero Miller portfolio is built on React Router v7 and contains substantial Epic Stack scaffolding that is not part of the live product. Rebuilding all of it would carry obsolete routes, dependencies, security gaps, and misleading domain language into a new application.

The active portfolio needs a separate, clean TanStack Start implementation that preserves production data, public behavior, visual identity, and the Administration area without changing or retiring the existing repository. The rewrite must also correct confirmed defects where doing so is necessary for security, deterministic behavior, accessibility, or truthful user feedback.

## Solution

Create a new TanStack Start application with an independent Git history, GitHub repository, and Vercel deployment. Reuse the existing Supabase PostgreSQL database contract, Prisma migration history, custom username/password authentication, database sessions, and database image blobs.

Build only the active Homepage, Painting gallery and details, Contact message flow, authentication entry points, Administration area, image resources, SEO endpoints, and shared presentation shell. Use Tailwind CSS v4, shadcn/ui components based on Base UI, TanStack Form with Zod, and TanStack Start route loaders and server functions.

Keep the React Router application unchanged and live while the rewrite is developed and validated.

## User Stories

1. As a visitor, I want to open the Homepage, so that I can learn about Vero Miller and see a selection of Paintings.
2. As a visitor, I want the Homepage to work when its optional image is absent, so that the introduction remains available.
3. As a visitor, I want Homepage preview Paintings to appear in a stable order, so that the page does not change unpredictably.
4. As a visitor, I want to open the complete Painting gallery, so that I can browse available portfolio work.
5. As a visitor, I want only Paintings with images to appear publicly, so that incomplete Administration records remain private.
6. As a visitor, I want Paintings ordered consistently by creation time, so that repeated visits are predictable.
7. As a visitor, I want to filter Paintings using a Category link, so that I can focus on a particular kind of work.
8. As a visitor, I want existing `?q=<categoryId>` gallery links to continue working, so that bookmarks and shared links remain valid.
9. As a visitor, I want an explanatory empty state for an unavailable Category, so that an empty gallery does not look broken.
10. As a visitor, I want Categories sorted by their public navigation labels, so that navigation is predictable.
11. As a visitor, I want to open a Painting detail page from the gallery, so that I can inspect its images and information.
12. As a visitor, I want Painting images displayed in their managed order, so that the Artist controls their presentation.
13. As a visitor, I want to browse multiple Painting images in an accessible carousel and dialog, so that I can inspect the work closely.
14. As a visitor, I want to see a Painting title, CAD price text, measurements, and description, so that I can evaluate it.
15. As a visitor, I want an inquiry-oriented action rather than a misleading purchase action, so that I understand no order is created online.
16. As a visitor, I want the Painting inquiry action to open the Contact form with the Painting context, so that I do not need to identify it manually.
17. As a visitor, I want to send a general Contact message, so that I can ask Vero Miller a question.
18. As a visitor, I want Contact fields validated clearly, so that I can correct invalid or missing information.
19. As a visitor, I want a notice when an inquiry references a Painting that no longer exists, so that I understand why it cannot be prefilled.
20. As a visitor, I want the Contact form to remain usable after an invalid Painting reference, so that I can still send a general message.
21. As a visitor, I want truthful success feedback only after the Artist notification is delivered, so that my message is not silently lost.
22. As a visitor, I want a best-effort confirmation email, so that I have a record of my Contact message when delivery succeeds.
23. As a visitor, I want spam-trap fields handled without disrupting normal form use, so that automated spam is reduced.
24. As a visitor using assistive technology, I want public images to use managed alt text or a meaningful title fallback, so that their content is identifiable.
25. As a visitor, I want missing Painting and route URLs to return a useful 404 response, so that navigation failures are clear.
26. As a search engine, I want `robots.txt` and a public-only sitemap, so that public portfolio content can be indexed without exposing private routes.
27. As an Administrator, I want to log in using the existing username and password contract, so that I can maintain the portfolio without an account migration.
28. As an Administrator, I want a “remember me” option, so that I can choose between a browser session and a persistent login.
29. As an Administrator, I want logout to invalidate my database Session and browser cookie, so that the Administration area is no longer accessible.
30. As an Administrator, I want every Administration page and mutation protected, so that anonymous visitors cannot read or modify private content.
31. As an Administrator, I want access to require the `admin` role, so that authentication alone is insufficient.
32. As an Administrator, I want a username mismatch in `/administration/:username/**` to return 404, so that one username cannot be used to inspect another.
33. As an Administrator, I want `/administration` to direct me to my username-scoped Administration area, so that existing navigation remains familiar.
34. As an Administrator, I want to list, inspect, create, edit, and delete Paintings, so that I can maintain the portfolio.
35. As an Administrator, I want Painting forms to require title, price text, measurements, Category, and descriptive text, so that managed records retain current quality requirements.
36. As an Administrator, I want to add, remove, replace, describe, and order Painting images, so that I control their public presentation.
37. As an Administrator, I want image uploads restricted to JPEG, PNG, and WebP, so that unsupported and unsafe content is rejected.
38. As an Administrator, I want image validation enforced by the server, so that browser validation cannot be bypassed.
39. As an Administrator, I want an image-less Painting to remain manageable but absent from public pages, so that current incomplete-record behavior is preserved.
40. As an Administrator, I want Painting deletion to remove its associated image records, so that orphaned blobs are not retained.
41. As an Administrator, I want to list, inspect, create, edit, and delete Categories, so that public filters remain maintainable.
42. As an Administrator, I want each Category to retain a management name and a distinct public navigation label, so that internal and visitor-facing wording can differ.
43. As an Administrator, I want Category deletion to preserve its Paintings and leave them uncategorized, so that deleting navigation does not destroy portfolio work.
44. As an Administrator, I want a clear Category deletion warning, so that the uncategorization consequence is understood.
45. As an Administrator, I want to inspect and edit the single Homepage record, so that the public introduction remains maintainable.
46. As an Administrator, I want the Homepage image to remain optional, so that text-only presentation is supported.
47. As an Administrator, I want success and failure notifications for mutations, so that I know whether content was changed.
48. As an Administrator, I want existing production sessions invalidated at cutover, so that the new application begins with fresh authentication.
49. As a developer, I want a separate non-production Supabase project or branch, so that development, tests, and previews never mutate production data.
50. As a developer, I want sanitized seed data without real credentials, so that repository history cannot disclose reusable secrets.
51. As a developer, I want the complete Prisma migration history in the rewrite, so that the new repository can become the schema owner at cutover.
52. As a developer, I want route search parameters validated and typed, so that malformed input has explicit behavior.
53. As a developer, I want framework-independent domain and infrastructure modules, so that route files remain small and behavior can be tested in isolation.
54. As a developer, I want environment variables validated at startup, so that missing database, session, email, or indexing configuration fails clearly.
55. As a developer, I want the Artist recipient and sender addresses configured outside application code, so that deployment configuration does not require code changes.
56. As a developer, I want no Vercel-specific application APIs, so that a future hosting migration remains possible.
57. As a developer, I want critical behavior covered by automated tests, so that production cutover is based on evidence rather than visual inspection alone.
58. As a developer, I want the existing React Router repository left unchanged, so that the rewrite cannot destabilize the live application.

## Implementation Decisions

- The rewrite is a new TanStack Start application, repository, Git history, GitHub repository, and deployment.
- React Router source code is reference material only and must not be modified by this effort.
- TanStack Start supplies SSR, file-based routing, route loaders, server functions, error boundaries, and head metadata.
- TanStack Query is not included. Route loaders and server functions own server data, and successful mutations invalidate the relevant router data.
- Tailwind CSS v4 supplies styling through CSS-first theme tokens.
- shadcn/ui components use the Base UI primitive implementation and preserve the existing visual identity rather than introducing a redesign.
- TanStack Form and Zod provide shared client/server validation for login, Contact messages, and Administration forms.
- Prisma remains the ORM. The complete existing PostgreSQL schema and migration history move to this repository without dropping unused legacy tables during the rewrite.
- Supabase remains the PostgreSQL host only. Supabase Auth and Storage are not adopted.
- Runtime database access uses the Supabase transaction pool connection; migration commands use the direct or session-pool connection.
- The target repository becomes the sole owner of Prisma migrations only at production cutover.
- A separate non-production Supabase project or branch supplies safe development, test, and preview data.
- Custom authentication remains username/password with bcrypt-compatible password verification.
- Authentication remains a signed, HTTP-only, secure, same-site cookie containing a database Session identifier.
- A centralized authentication module exposes anonymous-session lookup, required-Administrator enforcement, login, logout, and safe redirect behavior.
- A centralized authorization guard requires both an authenticated identity and the `admin` role for every Administration loader and mutation.
- The authenticated username must equal `:username`; mismatches return 404.
- The production session secret and active Sessions are rotated or invalidated at cutover.
- Password recovery routes are not implemented because the source recovery flow is nonfunctional scaffolding. The dead login link is removed.
- A portfolio data module encapsulates reads and writes for Paintings, Categories, the singleton Homepage, and their images.
- The Homepage is treated as a singleton in application behavior. Administration supports inspection and editing, not creation of multiple Homepage records.
- Public Paintings require at least one image. Image-less records remain visible only in Administration until a future lifecycle model is introduced.
- Public Painting order is `createdAt` ascending. Homepage previews use the first four public Paintings in that order.
- Category navigation order is alphabetical by public navigation label.
- Painting detail images are ordered by managed position with a deterministic tie-breaker.
- Gallery search retains `?q=<categoryId>`. Contact prefill retains `?q=<paintingId>`.
- Missing gallery Categories produce an explanatory empty state without rewriting the URL.
- Missing Contact Painting references produce an availability notice and an otherwise usable general form.
- A Contact delivery module renders and sends the Artist notification and visitor auto-reply through Resend.
- Artist notification delivery determines success. Visitor auto-reply delivery is best effort and is logged if it fails.
- Artist recipient, sender identity, Resend key, and indexing behavior are environment configuration.
- Honeypot fields remain on login and Contact forms. Rate limiting is intentionally deferred and documented as a launch risk.
- An image module owns MIME allow-listing, size checks, byte conversion, cache headers, lookup behavior, and public response creation.
- Accepted upload types are JPEG, PNG, and WebP. Content type and server-side file checks must agree.
- Existing Painting and Homepage image resource URL contracts are preserved.
- Public images use immutable caching because replacing image content produces a new image identifier.
- Stored alt text is optional. Public presentation falls back to the related Painting or Homepage title.
- Existing visual assets, logo components, SVG artwork, colors, spacing, responsive layout, Google Fonts, and the licensed Buongiorno font are migrated.
- `robots.txt` points to the generated sitemap.
- The sitemap includes only `/`, `/paintings`, `/paintings/:id`, and `/contact-me`; authentication, Administration, resource, and error routes are excluded.
- Public routes receive accurate titles and descriptions. Administration and authentication routes are marked non-indexable.
- Unknown routes receive a dedicated 404 UI; route and server failures receive safe error boundaries without exposing secrets.
- Application logs record server errors and failed supplementary email delivery. Sentry is deferred.
- Security headers are configured for the deployed application without copying the obsolete Express server.

### Deep modules

- **Authentication and authorization**: presents a small interface for session lookup, required-Administrator access, login, logout, and username invariants while hiding cookies, hashing, and Prisma queries.
- **Portfolio repository**: presents purpose-specific public and Administration operations while hiding Prisma selection, ordering, ownership, and transactional writes.
- **Image service**: presents upload validation and cached image responses while hiding MIME checks, byte handling, database blobs, and identifier replacement.
- **Contact delivery service**: presents one Contact-message operation while hiding template rendering, Resend calls, required-versus-best-effort delivery, and logging.
- **Form system**: presents reusable accessible fields and server validation adapters while hiding TanStack Form wiring and Base UI composition.
- **SEO service**: presents route metadata, indexing policy, robots output, and public sitemap generation from a single source of truth.

## Testing Decisions

- Tests assert externally observable behavior rather than route implementation, Prisma call shape, component internals, or framework hooks.
- Vitest covers Zod contracts, search-parameter behavior, authentication/session transitions, authorization outcomes, deterministic ordering, image validation, Category deletion consequences, singleton Homepage behavior, and Contact delivery success rules.
- Database integration tests run against the isolated non-production PostgreSQL test environment and exercise real Prisma constraints and transactions.
- Resend is replaced by a deterministic test adapter that records deliveries without sending external email.
- Playwright covers Homepage rendering, gallery navigation, valid and invalid Category filters, Painting details, Painting inquiries, general Contact messages, login/logout, rejected anonymous Administration access, rejected non-admin access, username mismatch, and Administration CRUD.
- Playwright image tests cover accepted formats, rejected formats, image order, replacement, removal, and public retrieval.
- SEO tests cover metadata, non-indexable private routes, `robots.txt`, sitemap contents, and 404 responses.
- Accessibility checks cover form labels and errors, dialog/carousel keyboard behavior, focus handling, image alternatives, and responsive navigation.
- No source E2E tests are copied because they target removed Epic Stack onboarding, 2FA, and profile functionality.
- A route parity checklist supplements automation for visual identity, responsive behavior, static assets, and production data reads.

## Implementation Tasks

### 1. Repository and application foundation

- [ ] Initialize an independent Git repository in the target workspace.
- [ ] Scaffold the latest stable TanStack Start React application.
- [ ] Configure TypeScript, npm scripts, formatting, linting, Vitest, and Playwright.
- [ ] Install and configure Tailwind CSS v4.
- [ ] Initialize shadcn/ui with the TanStack Start template and Base UI primitives.
- [ ] Define CSS-first brand tokens and responsive typography.
- [ ] Add environment validation and an accurate `.env.example` without credentials.
- [ ] Add CI checks for format, lint, typecheck, unit/integration tests, E2E tests, and production build.

### 2. Database foundation

- [ ] Copy the complete Prisma schema and migration history.
- [ ] Upgrade Prisma for the new application without changing production data semantics.
- [ ] Configure pooled runtime and direct migration database connections.
- [ ] Create a request-safe Prisma client module.
- [ ] Provision and document the non-production Supabase project or branch.
- [ ] Create sanitized seed data with generated test credentials.
- [ ] Add a database connectivity smoke test.
- [ ] Confirm the target schema produces no unintended destructive migration.

### 3. Shared domain and infrastructure modules

- [ ] Implement the portfolio repository.
- [ ] Implement the image service.
- [ ] Implement the authentication and authorization module.
- [ ] Implement the Contact delivery service and email templates.
- [ ] Implement shared TanStack Form and Base UI field components.
- [ ] Implement toast/notification handling.
- [ ] Implement safe redirects, route errors, and not-found behavior.
- [ ] Implement SEO metadata, robots, and sitemap services.

### 4. Shared visual shell

- [ ] Migrate logo, decorative SVG, Instagram, manifest, and favicon assets.
- [ ] Locate and add the licensed Buongiorno font asset.
- [ ] Recreate the responsive public navigation and Category submenu.
- [ ] Recreate the light-only visual theme using Tailwind v4 tokens.
- [ ] Add root document metadata, scripts, error UI, and notification UI.
- [ ] Verify keyboard navigation and mobile/desktop layouts.

### 5. Public portfolio routes

- [ ] Implement the Homepage loader and presentation.
- [ ] Implement stable Homepage Painting previews.
- [ ] Implement `/paintings` and typed `q` validation.
- [ ] Implement valid, absent, and unavailable Category states.
- [ ] Implement `/paintings/:id` with ordered images.
- [ ] Implement the accessible image carousel and enlarged-image dialog.
- [ ] Implement the Painting inquiry CTA and Contact prefill navigation.
- [ ] Implement Painting and Homepage image resource routes with immutable caching.
- [ ] Add public route metadata and error states.

### 6. Contact message flow

- [ ] Implement the general Contact form with TanStack Form and Zod.
- [ ] Add honeypot fields and server checks.
- [ ] Implement valid Painting prefill and unavailable-Painting notice behavior.
- [ ] Send the required Artist notification.
- [ ] Send the best-effort visitor auto-reply.
- [ ] Redirect or render success feedback only after Artist delivery.
- [ ] Preserve user input and present errors when delivery fails.
- [ ] Remove hardcoded recipient and sender addresses from application code.

### 7. Authentication

- [ ] Implement signed authentication cookie storage.
- [ ] Implement database Session lookup and expiration.
- [ ] Implement username/password login and safe redirect validation.
- [ ] Implement persistent and browser-session login modes.
- [ ] Implement logout with database and cookie invalidation.
- [ ] Require the `admin` role for Administration access.
- [ ] Enforce `:username` equality with 404 on mismatch.
- [ ] Remove password recovery links and routes.
- [ ] Add an operational procedure for manually rotating an Administrator password.

### 8. Painting Administration

- [ ] Implement the username-scoped Painting list and index state.
- [ ] Implement Painting detail.
- [ ] Implement Painting creation with required fields.
- [ ] Implement Painting editing.
- [ ] Implement image preview, metadata, ordering, replacement, and removal.
- [ ] Implement Painting deletion with confirmation and cascading images.
- [ ] Ensure every read and mutation passes the centralized Administrator guard.
- [ ] Replace copied “note” terminology with Painting terminology.

### 9. Category Administration

- [ ] Implement the username-scoped Category list and index state.
- [ ] Implement Category detail.
- [ ] Implement Category creation and editing with both names.
- [ ] Implement Category deletion confirmation.
- [ ] Preserve Paintings by clearing their deleted Category relationship.
- [ ] Ensure every read and mutation passes the centralized Administrator guard.

### 10. Homepage Administration

- [ ] Implement the username-scoped singleton Homepage view.
- [ ] Implement Homepage title and text editing.
- [ ] Implement optional Homepage image preview, replacement, and removal.
- [ ] Prevent creation of additional Homepage records through the UI.
- [ ] Ensure every read and mutation passes the centralized Administrator guard.

### 11. SEO, security, and production configuration

- [ ] Implement public-only `sitemap.xml`.
- [ ] Implement `robots.txt`.
- [ ] Mark login and Administration routes non-indexable.
- [ ] Configure security and cache headers.
- [ ] Verify cookies are secure, HTTP-only, and same-site in production.
- [ ] Ensure logs never include credentials, session identifiers, Contact-message contents, or database URLs.
- [ ] Document honeypot-only abuse protection as an accepted launch risk.
- [ ] Configure a separate Vercel project without coupling application modules to Vercel APIs.

### 12. Verification and cutover readiness

- [ ] Implement all agreed unit and integration tests.
- [ ] Implement all critical Playwright journeys.
- [ ] Run accessibility checks.
- [ ] Compare public and Administration visual behavior across supported viewports.
- [ ] Validate against safe non-production data.
- [ ] Verify production database compatibility with read-only checks.
- [ ] Confirm no obsolete Epic Stack route is exposed.
- [ ] Rotate the production session secret and invalidate existing Sessions at cutover.
- [ ] Complete the route, data, email, image, SEO, and deployment parity checklist.

## Out of Scope

- Changes to or retirement of the React Router repository and deployment.
- Migration to Supabase Auth.
- Migration from PostgreSQL image blobs to Supabase Storage, Vercel Blob, or another object store.
- A draft/published Painting lifecycle.
- A structured money and availability model.
- A redesigned Category deletion policy.
- Password recovery.
- User registration, OAuth, 2FA, onboarding, profile settings, and personal-data export.
- `/tos`, `/me`, theme switching, inactive healthcheck behavior, and unused Epic Stack routes.
- TanStack Query.
- Sentry integration.
- Cloudflare Workers deployment.
- Application-level or provider-level rate limiting.
- A public or Administration redesign.
- A decision about when the existing application may be retired.

## Further Notes

- The image upload design remains a cutover blocker. Vercel Functions enforce a 4.5 MB payload limit, while the source form permits up to five images of 3 MB each. The final implementation must resolve this before production approval; copying the current validation unchanged is not deployable for all accepted inputs.
- The source references a Buongiorno font file that is not currently discoverable in either repository. Its exact path or licensed asset must be supplied before visual parity can be completed.
- The source seed contains a plaintext Administrator credential. It must not be copied, and any credential that was reused outside disposable test data should be rotated.
- The existing Prisma schema contains legacy models that are not used by the rewritten product. They remain during this rewrite to avoid combining framework migration with destructive schema cleanup.
- Rate limiting was intentionally declined for this phase. Honeypots do not prevent password guessing or repeated email submissions, so this remains an explicit security risk.
