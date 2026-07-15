import { describe, expect, it } from 'vitest'

import {
  HONEYPOT_FIELDS,
  contactMessageSchema,
  isHoneypotTriggered,
  parseContactEnv,
  resolvePaintingContext,
  submitContactMessage,
  toContactValues,
} from './contact'
import type {
  ContactPaintingRepository,
  EmailAdapter,
  EmailMessage,
} from './contact'

const config = {
  artistEmail: 'artist@example.test',
  fromEmail: 'no-reply@example.test',
}

function createRecordingAdapter(
  options: { failFor?: (message: EmailMessage) => boolean } = {},
): EmailAdapter & { sent: Array<EmailMessage> } {
  const sent: Array<EmailMessage> = []
  return {
    sent,
    async send(message) {
      if (options.failFor?.(message)) {
        throw new Error('delivery failed')
      }
      sent.push(message)
    },
  }
}

function createPaintingRepository(
  paintings: Record<string, string>,
): ContactPaintingRepository {
  return {
    async findPaintingSummary(id) {
      const title = paintings[id]
      return title ? { id, title } : null
    },
  }
}

const generalMessage = {
  name: 'Dana Visitor',
  email: 'dana@example.test',
  message: 'Do you take commissions?',
}

describe('contactMessageSchema', () => {
  it('accepts and trims a valid general message', () => {
    const parsed = contactMessageSchema.parse({
      name: '  Dana  ',
      email: 'dana@example.test',
      message: '  Hello there  ',
      paintingId: '',
    })
    expect(parsed).toMatchObject({
      name: 'Dana',
      email: 'dana@example.test',
      message: 'Hello there',
      paintingId: null,
    })
  })

  it('rejects a missing name, invalid email, or empty message', () => {
    expect(
      contactMessageSchema.safeParse({ ...generalMessage, name: '' }).success,
    ).toBe(false)
    expect(
      contactMessageSchema.safeParse({ ...generalMessage, email: 'nope' })
        .success,
    ).toBe(false)
    expect(
      contactMessageSchema.safeParse({ ...generalMessage, message: '   ' })
        .success,
    ).toBe(false)
  })
})

describe('isHoneypotTriggered', () => {
  it('detects any filled spam-trap field', () => {
    expect(isHoneypotTriggered({ ...generalMessage })).toBe(false)
    for (const field of HONEYPOT_FIELDS) {
      expect(isHoneypotTriggered({ [field]: 'bot' })).toBe(true)
      expect(isHoneypotTriggered({ [field]: '   ' })).toBe(false)
    }
  })
})

describe('resolvePaintingContext', () => {
  const repository = createPaintingRepository({ 'painting-1': 'Blooming' })

  it('reports no context when no reference is provided', async () => {
    expect(await resolvePaintingContext(repository, undefined)).toEqual({
      kind: 'none',
    })
    expect(await resolvePaintingContext(repository, '   ')).toEqual({
      kind: 'none',
    })
  })

  it('resolves the Painting title from the id, never the client', async () => {
    expect(await resolvePaintingContext(repository, 'painting-1')).toEqual({
      kind: 'available',
      painting: { id: 'painting-1', title: 'Blooming' },
    })
  })

  it('flags a reference that no longer exists', async () => {
    expect(await resolvePaintingContext(repository, 'gone')).toEqual({
      kind: 'unavailable',
    })
  })
})

describe('submitContactMessage', () => {
  it('sends the Artist notification and a best-effort auto-reply for a general message', async () => {
    const email = createRecordingAdapter()
    const result = await submitContactMessage(
      { email, config },
      { ...generalMessage },
    )

    expect(result).toEqual({ status: 'sent' })
    expect(email.sent).toHaveLength(2)

    const [artist, reply] = email.sent
    expect(artist.to).toBe(config.artistEmail)
    expect(artist.from).toBe(config.fromEmail)
    expect(artist.replyTo).toBe(generalMessage.email)
    expect(artist.text).toContain(generalMessage.message)
    expect(reply.to).toBe(generalMessage.email)
  })

  it('resolves Painting context server-side and never trusts a client title', async () => {
    const email = createRecordingAdapter()
    const paintingRepository = createPaintingRepository({
      'painting-1': 'Blooming',
    })
    const result = await submitContactMessage(
      { email, config, paintingRepository },
      {
        ...generalMessage,
        paintingId: 'painting-1',
        paintingTitle: 'Totally Made Up',
      },
    )

    expect(result).toEqual({ status: 'sent' })
    expect(email.sent[0].subject).toContain('Blooming')
    expect(email.sent[0].text).not.toContain('Totally Made Up')
  })

  it('still delivers when the referenced Painting no longer exists', async () => {
    const email = createRecordingAdapter()
    const paintingRepository = createPaintingRepository({})
    const result = await submitContactMessage(
      { email, config, paintingRepository },
      { ...generalMessage, paintingId: 'gone' },
    )

    expect(result).toEqual({ status: 'sent' })
    expect(email.sent).toHaveLength(2)
  })

  it('treats a filled honeypot as spam without sending anything', async () => {
    const email = createRecordingAdapter()
    const result = await submitContactMessage(
      { email, config },
      { ...generalMessage, website: 'http://spam.test' },
    )

    expect(result).toEqual({ status: 'spam' })
    expect(email.sent).toHaveLength(0)
  })

  it('reports validation errors and preserves input without sending', async () => {
    const email = createRecordingAdapter()
    const result = await submitContactMessage(
      { email, config },
      { ...generalMessage, email: 'not-an-email' },
    )

    expect(result.status).toBe('invalid')
    if (result.status === 'invalid') {
      expect(result.values.name).toBe(generalMessage.name)
      expect(result.values.message).toBe(generalMessage.message)
      expect(result.error).toMatch(/email/i)
    }
    expect(email.sent).toHaveLength(0)
  })

  it('fails the submission when the required Artist notification is not delivered', async () => {
    const email = createRecordingAdapter({
      failFor: (message) => message.to === config.artistEmail,
    })
    const result = await submitContactMessage(
      { email, config },
      { ...generalMessage },
    )

    expect(result.status).toBe('delivery-failed')
    if (result.status === 'delivery-failed') {
      expect(result.values.message).toBe(generalMessage.message)
    }
    expect(email.sent).toHaveLength(0)
  })

  it('succeeds and logs safely when only the best-effort auto-reply fails', async () => {
    const logged: Array<string> = []
    const email = createRecordingAdapter({
      failFor: (message) => message.to === generalMessage.email,
    })
    const result = await submitContactMessage(
      {
        email,
        config,
        logger: { warn: (message) => logged.push(message) },
      },
      { ...generalMessage },
    )

    expect(result).toEqual({ status: 'sent' })
    // The Artist notification survived; only the reply failed.
    expect(email.sent).toHaveLength(1)
    expect(email.sent[0].to).toBe(config.artistEmail)
    expect(logged).toHaveLength(1)
    // Logs never include the visitor's message contents.
    expect(logged[0]).not.toContain(generalMessage.message)
  })
})

describe('toContactValues', () => {
  it('normalizes raw form input into echo-safe values', () => {
    expect(
      toContactValues({
        name: '  Dana  ',
        email: ' dana@example.test ',
        message: ' Hi ',
        paintingId: ' painting-1 ',
        website: 'ignored',
      }),
    ).toEqual({
      name: 'Dana',
      email: 'dana@example.test',
      message: 'Hi',
      paintingId: 'painting-1',
    })
  })
})

describe('parseContactEnv', () => {
  it('requires validated recipient, sender, and Resend credentials', () => {
    expect(parseContactEnv({}).ok).toBe(false)
    expect(
      parseContactEnv({
        ARTIST_EMAIL: 'not-an-email',
        EMAIL_FROM: 'no-reply@example.test',
        RESEND_API_KEY: 're_key',
      }).ok,
    ).toBe(false)
  })

  it('accepts a complete configuration', () => {
    const result = parseContactEnv({
      ARTIST_EMAIL: 'artist@example.test',
      EMAIL_FROM: 'no-reply@example.test',
      RESEND_API_KEY: 're_key',
    })
    expect(result).toEqual({
      ok: true,
      artistEmail: 'artist@example.test',
      fromEmail: 'no-reply@example.test',
      resendApiKey: 're_key',
    })
  })
})
