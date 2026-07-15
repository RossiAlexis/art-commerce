import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ContactView } from './contact-view'
import type { PaintingContextResult } from './contact'

function render(context: PaintingContextResult, extra = {}) {
  return renderToStaticMarkup(
    <ContactView
      context={context}
      status={{ kind: 'idle' }}
      pending={false}
      onSubmit={() => {}}
      {...extra}
    />,
  )
}

describe('ContactView', () => {
  it('renders an accessible general Contact form with honeypot traps', () => {
    const markup = render({ kind: 'none' })

    expect(markup).toContain('for="name"')
    expect(markup).toContain('for="email"')
    expect(markup).toContain('for="message"')
    // Honeypot fields are present but hidden from assistive tech and tab order.
    expect(markup).toContain('name="company"')
    expect(markup).toContain('name="website"')
    expect(markup).toContain('aria-hidden="true"')
  })

  it('prefills the Painting context from a resolved reference', () => {
    const markup = render({
      kind: 'available',
      painting: { id: 'painting-1', title: 'Blooming' },
    })

    expect(markup).toContain('Blooming')
    expect(markup).toContain('value="painting-1"')
  })

  it('shows an availability notice but keeps a usable form for a stale reference', () => {
    const markup = render({ kind: 'unavailable' })

    expect(markup).toContain('no longer available')
    // The general form still renders.
    expect(markup).toContain('for="message"')
  })

  it('reports a successful submission', () => {
    const markup = render(
      { kind: 'none' },
      { status: { kind: 'success', message: 'Your message was sent.' } },
    )

    expect(markup).toContain('Your message was sent.')
    expect(markup).toContain('role="status"')
  })

  it('reports a delivery error', () => {
    const markup = render(
      { kind: 'none' },
      { status: { kind: 'error', message: 'Could not send.' } },
    )

    expect(markup).toContain('Could not send.')
    expect(markup).toContain('role="alert"')
  })
})
