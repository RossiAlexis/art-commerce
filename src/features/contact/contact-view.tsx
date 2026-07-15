import { useEffect, useRef, useState } from 'react'

import { contactMessageSchema } from './contact'
import type { PaintingContextResult } from './contact'

export type ContactStatus =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

export type ContactSubmitPayload = {
  name: string
  email: string
  message: string
  paintingId: string
  company: string
  website: string
}

type ContactViewProps = {
  context: PaintingContextResult
  status: ContactStatus
  pending: boolean
  onSubmit: (payload: ContactSubmitPayload) => void
}

export function ContactView({
  context,
  status,
  pending,
  onSubmit,
}: ContactViewProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const paintingId = context.kind === 'available' ? context.painting.id : ''

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    // Client-side check with the exact schema the server re-enforces.
    const parsed = contactMessageSchema.safeParse({
      name: form.get('name'),
      email: form.get('email'),
      message: form.get('message'),
      paintingId: form.get('paintingId'),
    })
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message ??
          'Please correct the highlighted fields.',
      )
      return
    }

    setFieldError(null)
    onSubmit({
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      message: String(form.get('message') ?? ''),
      paintingId: String(form.get('paintingId') ?? ''),
      company: String(form.get('company') ?? ''),
      website: String(form.get('website') ?? ''),
    })
  }

  // A successful send clears the form so the visitor is not left with stale
  // input; a failure leaves everything they typed in place.
  useEffect(() => {
    if (status.kind === 'success') {
      formRef.current?.reset()
    }
  }, [status])

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 py-12 md:py-16">
      <h1 className="font-display text-4xl text-[#3f4f23] md:text-5xl">
        Contact
      </h1>
      <p className="mt-3 text-sm leading-7 text-stone-700 md:text-base">
        Send Vero Miller a message about a Painting, a commission, or any
        question you have.
      </p>

      {context.kind === 'available' ? (
        <p
          role="note"
          className="mt-6 rounded border border-[#3f4f23]/40 bg-[#f4f6ec] px-4 py-3 text-sm text-[#3f4f23]"
        >
          You are inquiring about{' '}
          <span className="font-medium">{context.painting.title}</span>.
        </p>
      ) : null}

      {context.kind === 'unavailable' ? (
        <p
          role="note"
          className="mt-6 rounded border border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          The Painting you asked about is no longer available. You can still
          send a general message below.
        </p>
      ) : null}

      {status.kind === 'success' ? (
        <p
          role="status"
          className="mt-6 rounded border border-green-600 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {status.message}
        </p>
      ) : null}
      {status.kind === 'error' ? (
        <p
          role="alert"
          className="mt-6 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {status.message}
        </p>
      ) : null}

      <form ref={formRef} className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <input type="hidden" name="paintingId" value={paintingId} readOnly />

        {/* Spam-trap fields: hidden from sighted users, screen readers, and
            the tab order. A human never fills them; bots often do. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            className="w-full rounded border border-stone-400 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded border border-stone-400 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="message" className="block text-sm font-medium">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            className="w-full rounded border border-stone-400 px-3 py-2"
          />
        </div>

        {fieldError ? (
          <p role="alert" className="text-sm text-red-700">
            {fieldError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-fit items-center justify-center rounded-full bg-[#3f4f23] px-6 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-[#526a27] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#688329] disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </main>
  )
}
