import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPrisma } from '#/server/db'

import {
  DELIVERY_FAILED_ERROR,
  parseContactEnv,
  resolvePaintingContext,
  submitContactMessage,
  toContactValues,
} from './contact'
import type {
  ContactPaintingRepository,
  ContactSubmissionResult,
  EmailAdapter,
} from './contact'

const prismaContactPaintingRepository: ContactPaintingRepository = {
  findPaintingSummary(id) {
    // Only publicly visible Paintings (those with at least one image) can be
    // inquired about, matching the public detail-route visibility rule.
    return getPrisma().painting.findFirst({
      where: { id, images: { some: {} } },
      select: { id: true, title: true },
    })
  },
}

/** Resend HTTP adapter. Throws unless the API accepts the message. */
function createResendAdapter(apiKey: string): EmailAdapter {
  return {
    async send(message) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          reply_to: message.replyTo,
        }),
      })
      if (!response.ok) {
        throw new Error(`Resend responded with status ${response.status}`)
      }
    },
  }
}

const contactContextInput = z.object({ q: z.string().optional() })

/** Resolve the inquiry context for the Contact page from a `?q` reference. */
export const getContactContextFn = createServerFn({ method: 'GET' })
  .validator(contactContextInput)
  .handler(({ data }) =>
    resolvePaintingContext(prismaContactPaintingRepository, data.q),
  )

const contactSubmissionInput = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  message: z.string().optional(),
  paintingId: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
})

/** Submit a Contact message: validate, honeypot-check, and deliver. */
export const submitContactFn = createServerFn({ method: 'POST' })
  .validator(contactSubmissionInput)
  .handler(async ({ data }): Promise<ContactSubmissionResult> => {
    const env = parseContactEnv(process.env)
    if (!env.ok) {
      // Never leak which configuration is missing to the visitor.
      console.error('Contact delivery is not configured; submission rejected.')
      return {
        status: 'delivery-failed',
        error: DELIVERY_FAILED_ERROR,
        values: toContactValues(data),
      }
    }

    return submitContactMessage(
      {
        email: createResendAdapter(env.resendApiKey),
        config: { artistEmail: env.artistEmail, fromEmail: env.fromEmail },
        paintingRepository: prismaContactPaintingRepository,
        logger: { warn: (message) => console.warn(message) },
      },
      data,
    )
  })
