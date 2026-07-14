# React Router to TanStack Start migration

Status: Draft — decisions are being resolved through the planning interview.

## Goal

Rewrite only the production behavior that remains in use, preserving its public behavior and visual identity while replacing the framework and UI foundations.
The rewrite is a completely separate repository, Git history, GitHub repository, and deployment. The React Router application remains live and unchanged until the rewrite is fully validated.

## Confirmed foundations

- Build a clean TanStack Start application in this repository.
- Use Tailwind CSS v4 and shadcn/ui components based on Base UI.
- Preserve the existing Supabase PostgreSQL data, Prisma models and migrations, custom username/password sessions, and database-backed images.
- Use TanStack Start route loaders and server functions without TanStack Query.
- Use TanStack Form and Zod for forms and shared validation.
- Keep application code independent of Vercel-specific APIs; deploy the initial rewrite to Vercel.
- Use a separate non-production Supabase project or branch with safe seed data for development, tests, and previews.

## Confirmed route scope

### Public

- `/`
- `/paintings`
- `/paintings/:id`
- `/contact-me`
- `/robots.txt`
- `/sitemap.xml`
- Existing image resource URLs required by these pages

The gallery retains `?q=<categoryId>` as its only filter contract. Painting details retain the image gallery and Painting inquiry flow through `/contact-me?q=<paintingId>`.

### Authentication

- `/login`
- `/logout`

### Administration

Preserve the existing `/administration/:username/**` URL structure and all Painting, Category, and Homepage management screens. Every Administration read and mutation must require an authenticated Administrator with the `admin` role.
The `:username` must match the authenticated Administrator; mismatches return 404.

## Deliberately excluded

- Unused Epic Stack template routes and components
- The nonfunctional password recovery scaffolding (`/forgot-password`, `/verify`, and `/reset-password`); remove the dead “Forgot password?” link
- Any modification or retirement plan for the existing React Router repository and deployment
- Sentry integration, which is inactive in the source application
- Supabase Auth and Storage migration
- Cloudflare deployment work
- Application rate limiting; honeypots remain, and the resulting brute-force/submission risk must be reviewed before launch

## Behavioral corrections included

- A Contact message succeeds only when delivery to the Artist succeeds; the visitor auto-reply is best effort.
- An invalid `/contact-me?q=<paintingId>` remains a usable contact form and displays a “Painting no longer available” notice instead of prefilling missing data.
- Painting detail uses an inquiry-oriented CTA rather than “Buy,” because the flow sends a Painting inquiry rather than creating an order.
- An unknown or deleted `/paintings?q=<categoryId>` filter preserves the filtered URL and shows an explanatory empty state.
- Public Painting lists use deterministic `createdAt` ascending order; the Homepage shows the first four visible Paintings in that order.
- Category navigation is sorted alphabetically by its public navigation label.
- Public images use stored alt text when present and fall back to the Painting or Homepage title.
- Image uploads are validated server-side and limited to JPEG, PNG, and WebP; SVG and unknown content types are rejected.
- Measurements remain required when creating or editing a Painting.
- All Administration routes receive consistent authentication and authorization.
- Seed data must never contain real or reusable credentials.
- Production cutover rotates the session secret/cookie contract, invalidates existing Sessions, and requires a fresh Administrator login.

## Open cutover decisions

- Resolve multipart image uploads against Vercel's 4.5 MB function payload limit. The source editor permits up to five images of 3 MB each, so copying that validation unchanged would allow requests the hosting platform rejects before application code runs.

## Deferred improvements

- Add an explicit draft/published lifecycle for Paintings. Until then, preserve the current behavior: an image-less Painting can be managed in Administration but is absent from the public gallery.
- Revisit Category deletion policy. Until then, deleting a Category keeps its Paintings and leaves them uncategorized, with an explicit confirmation in the UI.
- Replace the free-form Painting price string with an explicit money and availability model.
- Move image blobs from PostgreSQL to object storage in a separate migration.
- Reconsider Cloudflare Workers deployment as a separate runtime migration.
- Add rate limiting for login, password reset, and contact submissions.

## Cutover gate

- Build and validate the rewrite in a separate Vercel project.
- Automate critical public and Administration journeys with Playwright.
- Add unit/integration coverage for validation, authentication, authorization, and database mutations.
- Switch the production domain only after the in-scope route and data parity checklist passes.
