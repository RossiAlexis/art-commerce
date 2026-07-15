import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ContactView } from '#/features/contact/contact-view'
import type {
  ContactStatus,
  ContactSubmitPayload,
} from '#/features/contact/contact-view'
import {
  getContactContextFn,
  submitContactFn,
} from '#/features/contact/contact.functions'

export const Route = createFileRoute('/contact-me')({
  validateSearch: z.object({ q: z.string().optional() }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => getContactContextFn({ data: { q: deps.q } }),
  head: () => ({
    meta: [
      { title: 'Art by Vero Miller - Contact' },
      {
        name: 'description',
        content:
          'Send Vero Miller a message or start an inquiry about an original painting.',
      },
    ],
  }),
  component: ContactPage,
})

function ContactPage() {
  const context = Route.useLoaderData()
  const [status, setStatus] = useState<ContactStatus>({ kind: 'idle' })
  const [pending, setPending] = useState(false)

  async function onSubmit(payload: ContactSubmitPayload) {
    setPending(true)
    setStatus({ kind: 'idle' })

    const result = await submitContactFn({ data: payload })

    setPending(false)

    // A silently-dropped spam submission looks identical to success so the
    // trap is never revealed to an automated client.
    if (result.status === 'sent' || result.status === 'spam') {
      setStatus({
        kind: 'success',
        message:
          'Thank you — your message has been sent. Vero will be in touch soon.',
      })
      return
    }

    setStatus({ kind: 'error', message: result.error })
  }

  return (
    <ContactView
      context={context}
      status={status}
      pending={pending}
      onSubmit={onSubmit}
    />
  )
}
