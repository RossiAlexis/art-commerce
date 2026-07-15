/**
 * Domain logic for the protected Painting create/edit journey and its image
 * lifecycle. It is framework-independent and orchestrated over a repository
 * interface so field validation, image validation, and the add/replace/
 * describe/reorder/remove operations can be unit-tested with an in-memory fake.
 * Server wiring (Prisma, the Administrator guard, multipart handling) lives in
 * `paintings-editor.functions.ts`.
 *
 * The upload contract is bound by Vercel's ~4.5 MB function payload limit: one
 * image per request, each capped at 4 MB, with the true content type sniffed
 * from the bytes rather than trusted from the client. See
 * `docs/adr/0002-painting-image-upload-flow.md`.
 */
import { z } from 'zod'

/** Per-image payload ceiling, kept safely under Vercel's ~4.5 MB body limit. */
export const MAX_PAINTING_IMAGE_BYTES = 4 * 1024 * 1024

/** Image content types the editor and public presentation support. */
export const ALLOWED_PAINTING_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AllowedPaintingImageType =
  (typeof ALLOWED_PAINTING_IMAGE_TYPES)[number]

/**
 * Shared client/server validation for the managed Painting fields. All five are
 * required (US 35); surrounding whitespace is trimmed so a whitespace-only value
 * is treated as empty. `price` and `measures` stay free-form text.
 */
export const paintingFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'A title is required.')
    .max(200, 'Title is too long.'),
  price: z
    .string()
    .trim()
    .min(1, 'Price text is required.')
    .max(200, 'Price text is too long.'),
  measures: z
    .string()
    .trim()
    .min(1, 'Measurements are required.')
    .max(200, 'Measurements are too long.'),
  categoryId: z.string().trim().min(1, 'A category is required.'),
  content: z
    .string()
    .trim()
    .min(1, 'A description is required.')
    .max(20_000, 'Description is too long.'),
})

export type PaintingFieldsInput = z.infer<typeof paintingFieldsSchema>

export type PaintingFieldErrors = Partial<
  Record<keyof PaintingFieldsInput, string>
>

export type PaintingFieldsResult =
  | { ok: true; data: PaintingFieldsInput }
  | { ok: false; errors: PaintingFieldErrors }

/** Validate and normalize raw Painting form fields into per-field errors. */
export function parsePaintingFields(input: unknown): PaintingFieldsResult {
  const parsed = paintingFieldsSchema.safeParse(input)
  if (parsed.success) {
    return { ok: true, data: parsed.data }
  }

  const errors: PaintingFieldErrors = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path[0]
    if (
      (key === 'title' ||
        key === 'price' ||
        key === 'measures' ||
        key === 'categoryId' ||
        key === 'content') &&
      !errors[key]
    ) {
      errors[key] = issue.message
    }
  }
  return { ok: false, errors }
}

/**
 * Determine an image's true type from its leading magic bytes. Returns `null`
 * for anything that is not a supported raster image, so SVG, HTML, and other
 * unknown content — including a disallowed file given an allowed extension or
 * declared type — is never accepted.
 */
export function detectImageType(
  bytes: Uint8Array,
): AllowedPaintingImageType | null {
  // JPEG: FF D8 FF
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg'
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  // WebP: "RIFF" <4 bytes size> "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

export type ImageValidationResult =
  | { ok: true; contentType: AllowedPaintingImageType }
  | { ok: false; error: string }

/**
 * Validate an uploaded image against the payload limit and the supported types.
 * The stored content type comes from sniffing the bytes, never from the
 * client-declared type; a non-empty declared type that disagrees with the bytes
 * is rejected as spoofed so browser validation cannot be bypassed (US 37, 38).
 */
export function validatePaintingImage(input: {
  contentType: string
  bytes: Uint8Array
}): ImageValidationResult {
  const size = input.bytes.byteLength
  if (size <= 0) {
    return { ok: false, error: 'Image file is empty.' }
  }
  if (size > MAX_PAINTING_IMAGE_BYTES) {
    return { ok: false, error: 'Each image must be 4 MB or smaller.' }
  }

  const detected = detectImageType(input.bytes)
  if (!detected) {
    return { ok: false, error: 'Image must be a JPEG, PNG, or WebP file.' }
  }

  const declared = input.contentType.trim()
  if (declared && declared !== detected) {
    return {
      ok: false,
      error: 'Image content does not match its declared type.',
    }
  }

  return { ok: true, contentType: detected }
}

export type NewPaintingImage = {
  contentType: AllowedPaintingImageType
  altText: string | null
  bytes: Uint8Array
}

/** A Category the editor's dropdown can assign a Painting to. */
export type CategoryOption = { id: string; name: string }

export type EditablePaintingImage = {
  id: string
  altText: string | null
  order: number
}

/** A Painting's editable state, including its current Category selection. */
export type EditablePainting = {
  id: string
  title: string
  price: string
  measures: string
  categoryId: string | null
  content: string
  images: Array<EditablePaintingImage>
}

/**
 * Persistence contract for the editor. Field writes and each image operation
 * are separate so a single request never batches more than one blob.
 */
export type PaintingEditorRepository = {
  createPainting: (fields: PaintingFieldsInput) => Promise<{ id: string }>
  updatePainting: (id: string, fields: PaintingFieldsInput) => Promise<boolean>
  addImage: (input: {
    paintingId: string
    image: NewPaintingImage
  }) => Promise<{ id: string } | null>
  replaceImage: (input: {
    imageId: string
    image: NewPaintingImage
  }) => Promise<{ id: string } | null>
  describeImage: (input: {
    imageId: string
    altText: string | null
  }) => Promise<boolean>
  reorderImages: (input: {
    paintingId: string
    orderedImageIds: Array<string>
  }) => Promise<boolean>
  removeImage: (imageId: string) => Promise<boolean>
}

export type PaintingSaveResult =
  { ok: true; id: string } | { ok: false; errors: PaintingFieldErrors }

export type ImageMutationResult =
  { ok: true; imageId?: string } | { ok: false; error: string }

/** Optional alt text: whitespace-only descriptions collapse to `null`. */
export function normalizeAltText(altText: string | null): string | null {
  const trimmed = altText?.trim()
  return trimmed ? trimmed : null
}

/** Validate and create a Painting from raw form fields. */
export async function createManagedPainting(
  repository: PaintingEditorRepository,
  rawFields: unknown,
): Promise<PaintingSaveResult> {
  const parsed = parsePaintingFields(rawFields)
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors }
  }
  const created = await repository.createPainting(parsed.data)
  return { ok: true, id: created.id }
}

/**
 * Validate and update an existing Painting's fields, or resolve to `null` when
 * the record no longer exists so the caller can surface a 404.
 */
export async function updateManagedPaintingFields(
  repository: PaintingEditorRepository,
  id: string,
  rawFields: unknown,
): Promise<PaintingSaveResult | null> {
  const parsed = parsePaintingFields(rawFields)
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors }
  }
  const updated = await repository.updatePainting(id, parsed.data)
  if (!updated) return null
  return { ok: true, id }
}

/** Validate an image payload and append it to a Painting's image list. */
export async function addManagedPaintingImage(
  repository: PaintingEditorRepository,
  input: {
    paintingId: string
    image: { contentType: string; altText: string | null; bytes: Uint8Array }
  },
): Promise<ImageMutationResult> {
  const validation = validatePaintingImage(input.image)
  if (!validation.ok) return validation

  const created = await repository.addImage({
    paintingId: input.paintingId,
    image: {
      contentType: validation.contentType,
      altText: normalizeAltText(input.image.altText),
      bytes: input.image.bytes,
    },
  })
  if (!created) {
    return { ok: false, error: 'The Painting could not be found.' }
  }
  return { ok: true, imageId: created.id }
}

/**
 * Validate an image payload and replace an existing image with it, producing a
 * new cache-safe identifier and leaving no orphan record.
 */
export async function replaceManagedPaintingImage(
  repository: PaintingEditorRepository,
  input: {
    imageId: string
    image: { contentType: string; altText: string | null; bytes: Uint8Array }
  },
): Promise<ImageMutationResult> {
  const validation = validatePaintingImage(input.image)
  if (!validation.ok) return validation

  const replaced = await repository.replaceImage({
    imageId: input.imageId,
    image: {
      contentType: validation.contentType,
      altText: normalizeAltText(input.image.altText),
      bytes: input.image.bytes,
    },
  })
  if (!replaced) {
    return { ok: false, error: 'The image could not be found.' }
  }
  return { ok: true, imageId: replaced.id }
}

/** Update an existing image's alt text. */
export async function describeManagedPaintingImage(
  repository: PaintingEditorRepository,
  input: { imageId: string; altText: string | null },
): Promise<ImageMutationResult> {
  const updated = await repository.describeImage({
    imageId: input.imageId,
    altText: normalizeAltText(input.altText),
  })
  if (!updated) {
    return { ok: false, error: 'The image could not be found.' }
  }
  return { ok: true }
}

/** Apply a new display order to a Painting's images. */
export async function reorderManagedPaintingImages(
  repository: PaintingEditorRepository,
  input: { paintingId: string; orderedImageIds: Array<string> },
): Promise<ImageMutationResult> {
  const reordered = await repository.reorderImages(input)
  if (!reordered) {
    return {
      ok: false,
      error: 'The image order could not be updated.',
    }
  }
  return { ok: true }
}

/** Remove a single image from a Painting. */
export async function removeManagedPaintingImage(
  repository: PaintingEditorRepository,
  imageId: string,
): Promise<ImageMutationResult> {
  const removed = await repository.removeImage(imageId)
  if (!removed) {
    return { ok: false, error: 'The image could not be found.' }
  }
  return { ok: true }
}
