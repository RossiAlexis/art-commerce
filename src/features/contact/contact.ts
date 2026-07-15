import { z } from 'zod'

/**
 * Shared client/server validation for a Contact message. The optional
 * `paintingId` carries the inquiry reference from `?q=<paintingId>`; the
 * Painting title is always resolved server-side and is never trusted from the
 * client, so no title field lives in this contract.
 */
export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  email: z.email('Enter a valid email address'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(5000, 'Message is too long'),
  paintingId: z.preprocess((value) => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    return trimmed === '' ? null : trimmed
  }, z.string().nullable()),
})

export type ContactMessageInput = z.infer<typeof contactMessageSchema>

/**
 * Spam-trap field names. They are rendered but visually hidden, so a human
 * never fills them; any non-empty value marks an automated submission. Kept
 * shared so the form and the server check stay in lockstep.
 */
export const HONEYPOT_FIELDS = ['company', 'website'] as const

export function isHoneypotTriggered(raw: Record<string, unknown>): boolean {
  return HONEYPOT_FIELDS.some((field) => {
    const value = raw[field]
    return typeof value === 'string' && value.trim() !== ''
  })
}

export type PaintingSummary = { id: string; title: string }

export type ContactPaintingRepository = {
  findPaintingSummary: (id: string) => Promise<PaintingSummary | null>
}

/** Outcome of resolving a `?q` reference for the Contact form loader. */
export type PaintingContextResult =
  | { kind: 'none' }
  | { kind: 'available'; painting: PaintingSummary }
  | { kind: 'unavailable' }

/**
 * Resolve the inquiry context for a Contact page load. A blank reference yields
 * `none`; a reference that no longer resolves yields `unavailable` so the page
 * can show a notice while keeping a usable general form.
 */
export async function resolvePaintingContext(
  repository: ContactPaintingRepository,
  q: string | undefined,
): Promise<PaintingContextResult> {
  const id = typeof q === 'string' ? q.trim() : ''
  if (!id) return { kind: 'none' }

  const painting = await repository.findPaintingSummary(id)
  return painting ? { kind: 'available', painting } : { kind: 'unavailable' }
}

export type EmailMessage = {
  to: string
  from: string
  replyTo?: string
  subject: string
  text: string
}

/** Delivery port. Implementations throw when a message is not accepted. */
export type EmailAdapter = {
  send: (message: EmailMessage) => Promise<void>
}

export type ContactLogger = {
  warn: (message: string) => void
}

/** Recipient and sender identity, sourced from validated environment config. */
export type ContactDeliveryConfig = {
  artistEmail: string
  fromEmail: string
}

export type ContactDeps = {
  email: EmailAdapter
  config: ContactDeliveryConfig
  paintingRepository?: ContactPaintingRepository
  logger?: ContactLogger
}

/** Echo-safe values used to repopulate the form after a failed submission. */
export type ContactValues = {
  name: string
  email: string
  message: string
  paintingId: string | null
}

export type ContactSubmissionResult =
  | { status: 'sent' }
  | { status: 'spam' }
  | { status: 'invalid'; error: string; values: ContactValues }
  | { status: 'delivery-failed'; error: string; values: ContactValues }

export const DELIVERY_FAILED_ERROR =
  'Your message could not be sent right now. Please try again shortly.'

export function toContactValues(raw: Record<string, unknown>): ContactValues {
  const read = (key: string) => {
    const value = raw[key]
    return typeof value === 'string' ? value.trim() : ''
  }
  const paintingId = read('paintingId')
  return {
    name: read('name'),
    email: read('email'),
    message: read('message'),
    paintingId: paintingId === '' ? null : paintingId,
  }
}

/**
 * Present one Contact-message operation while hiding template rendering,
 * delivery, and the required-versus-best-effort delivery contract:
 *
 * - A filled honeypot is silently dropped as spam (no delivery, no error).
 * - Invalid input is reported with the original values preserved.
 * - The Artist notification is REQUIRED: its failure fails the submission so a
 *   visitor is never told a lost message was sent.
 * - The visitor auto-reply is best effort: its failure is logged safely and
 *   never reverses a successful Artist delivery.
 */
export async function submitContactMessage(
  deps: ContactDeps,
  raw: Record<string, unknown>,
): Promise<ContactSubmissionResult> {
  if (isHoneypotTriggered(raw)) {
    return { status: 'spam' }
  }

  const parsed = contactMessageSchema.safeParse({
    name: raw.name,
    email: raw.email,
    message: raw.message,
    paintingId: raw.paintingId,
  })
  if (!parsed.success) {
    return {
      status: 'invalid',
      error: firstIssue(parsed.error),
      values: toContactValues(raw),
    }
  }

  // Resolve the referenced Painting server-side; a client-supplied title is
  // never used. A stale reference simply degrades to a general message.
  let painting: PaintingSummary | null = null
  if (parsed.data.paintingId && deps.paintingRepository) {
    painting = await deps.paintingRepository.findPaintingSummary(
      parsed.data.paintingId,
    )
  }

  try {
    await deps.email.send(
      renderArtistNotification(parsed.data, painting, deps.config),
    )
  } catch {
    return {
      status: 'delivery-failed',
      error: DELIVERY_FAILED_ERROR,
      values: toContactValues(raw),
    }
  }

  try {
    await deps.email.send(renderVisitorAutoReply(parsed.data, deps.config))
  } catch {
    // Never include Contact-message contents in logs.
    deps.logger?.warn(
      'Contact auto-reply delivery failed after Artist delivery',
    )
  }

  return { status: 'sent' }
}

function renderArtistNotification(
  input: ContactMessageInput,
  painting: PaintingSummary | null,
  config: ContactDeliveryConfig,
): EmailMessage {
  const subject = painting
    ? `New inquiry about "${painting.title}"`
    : 'New Contact message'

  const reference = painting
    ? `Painting inquiry: ${painting.title}`
    : input.paintingId
      ? 'Painting inquiry: referenced Painting is no longer available'
      : 'General message'

  const text = [
    reference,
    `From: ${input.name} <${input.email}>`,
    '',
    input.message,
  ].join('\n')

  return {
    to: config.artistEmail,
    from: config.fromEmail,
    replyTo: input.email,
    subject,
    text,
  }
}

function renderVisitorAutoReply(
  input: ContactMessageInput,
  config: ContactDeliveryConfig,
): EmailMessage {
  const text = [
    `Hi ${input.name},`,
    '',
    'Thank you for contacting Vero Miller. Your message has been received ' +
      'and you can expect a personal reply soon.',
    '',
    '— Art by Vero Miller',
  ].join('\n')

  return {
    to: input.email,
    from: config.fromEmail,
    subject: 'Thank you for contacting Vero Miller',
    text,
  }
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Please correct the highlighted fields.'
}

const contactEnvSchema = z.object({
  ARTIST_EMAIL: z.email(),
  EMAIL_FROM: z.email(),
  RESEND_API_KEY: z.string().min(1),
})

export type ParsedContactEnv =
  | {
      ok: true
      artistEmail: string
      fromEmail: string
      resendApiKey: string
    }
  | { ok: false; error: string }

/**
 * Validate the recipient, sender identity, and Resend credential from the
 * environment so deployment configuration — not code — controls delivery.
 */
export function parseContactEnv(
  input: Record<string, string | undefined>,
): ParsedContactEnv {
  const result = contactEnvSchema.safeParse(input)
  if (!result.success) {
    return { ok: false, error: 'Contact delivery is not configured.' }
  }
  return {
    ok: true,
    artistEmail: result.data.ARTIST_EMAIL,
    fromEmail: result.data.EMAIL_FROM,
    resendApiKey: result.data.RESEND_API_KEY,
  }
}
