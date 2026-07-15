# 2. Vercel-safe Painting image upload flow

Date: 2026-07-15

## Status

Accepted

## Context

The rewrite keeps Painting image blobs in PostgreSQL and serves them through a
TanStack Start server function (`/resources/note-images/:id`). The initial
deployment target is Vercel, whose Functions reject any request body larger
than **~4.5 MB** before application code runs — the request never reaches our
validation, so we cannot return a friendly error for it.

The source (Epic Stack) editor let an Administrator attach **up to five images
of 3 MB each in a single multipart submission** (up to ~15 MB per request).
Copying that contract unchanged would produce requests Vercel rejects at the
edge for every realistic multi-image save, making the editor undeployable for
its accepted inputs. This was recorded as the cutover blocker in
`docs/migration-plan.md` and `docs/migration-prd.md`.

Object storage (Supabase Storage / Vercel Blob) would sidestep the limit, but
the PRD explicitly **defers** moving blobs out of PostgreSQL to a separate
migration, and requires that application code stay free of Vercel-specific APIs
(no `@vercel/blob`, no Vercel client-upload token endpoint). The design must
therefore work within the 4.5 MB envelope while keeping blobs in Postgres.

## Decision

**Upload exactly one image per request, and cap each image at 4 MB.**

- Painting **field** edits (title, price, measurements, category, description)
  are a small JSON server function with no blob, so they are never near the
  limit.
- Each **image** operation — add, replace — is its own multipart request
  carrying a single file. Describe, reorder, and remove carry no blob at all.
- A shared constant `MAX_PAINTING_IMAGE_BYTES = 4 MB` is enforced **client-side**
  (a pre-submit size check that never sends an over-limit body) **and again
  server-side** (browser checks are bypassable). 4 MB < 4.5 MB, so a
  single-file request always fits with headroom for multipart framing.
- The server determines the true content type by sniffing magic bytes rather
  than trusting the browser-declared type, and stores that sniffed type. JPEG,
  PNG, and WebP are the only accepted signatures; SVG, spoofed, and unknown
  content are rejected.
- Replacing an image writes a **new** `PaintingImage` row (new `cuid`) and
  deletes the old one in the same transaction, so the immutable-cached
  `/resources/note-images/:id` URL changes on replacement and no orphan blob is
  left behind.

## Consequences

- **Trade-off:** an Administrator adds images one at a time instead of batching
  a single multi-file submission. Each upload is a discrete request with its own
  success/failure notification. This is the cost of staying under the platform
  limit without object storage.
- The 4 MB per-image ceiling is slightly below the source's 3-images-worth
  budget but comfortably covers a single high-quality JPEG/PNG/WebP; there is no
  cap on the number of images per Painting, only on per-request size.
- No Vercel-specific API is introduced, so a future move to object storage (or a
  different host) remains a self-contained migration, as the PRD requires.
- Client and server share one size/type contract, so browser validation cannot
  be bypassed to smuggle a larger or unsafe payload — the request either fits
  and is re-validated on the server, or is never sent.

## Approval

This design resolves the open cutover decision recorded in the migration plan.
Recording it here satisfies the requirement that the upload behavior and its
trade-offs be documented and approved before the editor implementation is
finalized.
