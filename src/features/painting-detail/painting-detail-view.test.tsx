import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PaintingDetailView } from './painting-detail-view'

const painting = {
  id: 'painting-1',
  title: 'Blooming',
  priceText: '$100 CAD',
  measures: '20 × 20 cm',
  description: 'A field of tulips in spring.',
  images: [
    { id: 'image-1', altText: 'A field of tulips' },
    { id: 'image-2', altText: null },
  ],
}

describe('PaintingDetailView', () => {
  it('server-renders the Painting title, price, measurements and description', () => {
    const markup = renderToStaticMarkup(<PaintingDetailView {...painting} />)

    expect(markup).toContain('Blooming')
    expect(markup).toContain('$100 CAD')
    expect(markup).toContain('20 × 20 cm')
    expect(markup).toContain('A field of tulips in spring.')
  })

  it('renders every managed image with meaningful alternatives', () => {
    const markup = renderToStaticMarkup(<PaintingDetailView {...painting} />)

    // Managed alt text is used when present, the Painting title is the fallback.
    expect(markup).toContain('alt="A field of tulips"')
    expect(markup).toContain('alt="Blooming"')
    expect(markup).toContain('/resources/note-images/image-1')
    expect(markup).toContain('/resources/note-images/image-2')
  })

  it('offers an inquiry action that opens the Contact form with the Painting', () => {
    const markup = renderToStaticMarkup(<PaintingDetailView {...painting} />)

    expect(markup).toContain('href="/contact-me?q=painting-1"')
    expect(markup).not.toContain('Buy')
  })
})
