import { z } from 'zod'

/**
 * Optional Homepage images are stored inline and served through a serverless
 * function, so the accepted payload must stay under the hosting body limit
 * (Vercel caps request bodies at ~4.5 MB). Keep this shared between the client
 * pre-check and the server-side validation.
 */
export const MAX_HOMEPAGE_IMAGE_BYTES = 4 * 1024 * 1024

/** Image content types the resource route and public presentation support. */
export const ALLOWED_HOMEPAGE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

/**
 * Shared client/server validation for the Homepage title and text. Both fields
 * are required; surrounding whitespace is trimmed so a whitespace-only value is
 * treated as empty.
 */
export const homepageContentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(160, 'Title is too long'),
  text: z
    .string()
    .trim()
    .min(1, 'Text is required')
    .max(10_000, 'Text is too long'),
})

export type HomepageContentInput = z.infer<typeof homepageContentSchema>

export type StoredHomepageImage = {
  id: string
  altText: string | null
}

export type AdminHomepageRecord = {
  id: string
  title: string
  text: string
  image: StoredHomepageImage | null
}

export type NewHomepageImage = {
  contentType: string
  altText: string | null
  bytes: Uint8Array
}

/**
 * Persistence contract for singleton Homepage maintenance. There is
 * deliberately no "create" or "delete" of Homepage records: Administration only
 * ever reads and mutates the single existing record and its optional image.
 */
export type HomepageAdminRepository = {
  getSingleton: () => Promise<AdminHomepageRecord | null>
  updateContent: (input: {
    id: string
    title: string
    text: string
  }) => Promise<AdminHomepageRecord>
  putImage: (input: {
    homepageId: string
    image: NewHomepageImage
  }) => Promise<AdminHomepageRecord>
  updateImageAltText: (input: {
    homepageId: string
    altText: string | null
  }) => Promise<AdminHomepageRecord>
  removeImage: (input: { homepageId: string }) => Promise<AdminHomepageRecord>
}

export type ImageValidationResult = { ok: true } | { ok: false; error: string }

export type HomepageMutationResult =
  { ok: true; homepage: AdminHomepageRecord } | { ok: false; error: string }

const MISSING_HOMEPAGE_ERROR = 'Homepage record was not found.'

/** Validate an uploaded image against the supported types and payload limit. */
export function validateHomepageImage(input: {
  contentType: string
  byteLength: number
}): ImageValidationResult {
  if (
    !ALLOWED_HOMEPAGE_IMAGE_TYPES.includes(
      input.contentType as (typeof ALLOWED_HOMEPAGE_IMAGE_TYPES)[number],
    )
  ) {
    return {
      ok: false,
      error: 'Image must be a JPEG, PNG, or WebP file.',
    }
  }

  if (input.byteLength <= 0) {
    return { ok: false, error: 'Image file is empty.' }
  }

  if (input.byteLength > MAX_HOMEPAGE_IMAGE_BYTES) {
    return { ok: false, error: 'Image must be 4 MB or smaller.' }
  }

  return { ok: true }
}

/** Read the singleton Homepage for inspection, or `null` when unconfigured. */
export function loadAdminHomepage(
  repository: HomepageAdminRepository,
): Promise<AdminHomepageRecord | null> {
  return repository.getSingleton()
}

/** Validate and persist new Homepage title/text onto the existing singleton. */
export async function saveHomepageContent(
  repository: HomepageAdminRepository,
  rawInput: unknown,
): Promise<HomepageMutationResult> {
  const parsed = homepageContentSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) }
  }

  const current = await repository.getSingleton()
  if (!current) {
    return { ok: false, error: MISSING_HOMEPAGE_ERROR }
  }

  const homepage = await repository.updateContent({
    id: current.id,
    title: parsed.data.title,
    text: parsed.data.text,
  })

  return { ok: true, homepage }
}

/** Add or replace the optional Homepage image after validating the payload. */
export async function saveHomepageImage(
  repository: HomepageAdminRepository,
  input: { image: NewHomepageImage },
): Promise<HomepageMutationResult> {
  const validation = validateHomepageImage({
    contentType: input.image.contentType,
    byteLength: input.image.bytes.byteLength,
  })
  if (!validation.ok) {
    return validation
  }

  const current = await repository.getSingleton()
  if (!current) {
    return { ok: false, error: MISSING_HOMEPAGE_ERROR }
  }

  const homepage = await repository.putImage({
    homepageId: current.id,
    image: input.image,
  })

  return { ok: true, homepage }
}

/** Update the alt text of the existing Homepage image. */
export async function describeHomepageImage(
  repository: HomepageAdminRepository,
  input: { altText: string | null },
): Promise<HomepageMutationResult> {
  const current = await repository.getSingleton()
  if (!current) {
    return { ok: false, error: MISSING_HOMEPAGE_ERROR }
  }
  if (!current.image) {
    return { ok: false, error: 'There is no image to describe.' }
  }

  const homepage = await repository.updateImageAltText({
    homepageId: current.id,
    altText: normalizeAltText(input.altText),
  })

  return { ok: true, homepage }
}

/** Remove the optional Homepage image; removing an absent image is a no-op. */
export async function removeHomepageImage(
  repository: HomepageAdminRepository,
): Promise<HomepageMutationResult> {
  const current = await repository.getSingleton()
  if (!current) {
    return { ok: false, error: MISSING_HOMEPAGE_ERROR }
  }
  if (!current.image) {
    return { ok: true, homepage: current }
  }

  const homepage = await repository.removeImage({ homepageId: current.id })
  return { ok: true, homepage }
}

/** Optional alt text: whitespace-only descriptions collapse to `null`. */
export function normalizeAltText(altText: string | null): string | null {
  const trimmed = altText?.trim()
  return trimmed ? trimmed : null
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid Homepage content.'
}
