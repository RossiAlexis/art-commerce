import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { GalleryView } from './gallery-view'

describe('GalleryView', () => {
  it('renders Category filters, alt text, and Painting detail links', () => {
    const markup = renderToStaticMarkup(
      <GalleryView
        categories={[
          { id: 'c-abstract', label: 'Abstract' },
          { id: 'c-portraits', label: 'Portraits' },
        ]}
        paintings={[
          {
            id: 'painting-1',
            title: 'Blooming',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            images: [{ id: 'image-1', altText: 'A field of tulips' }],
          },
          {
            id: 'painting-2',
            title: 'Serenity',
            createdAt: new Date('2024-01-02T00:00:00.000Z'),
            images: [{ id: 'image-2', altText: null }],
          },
        ]}
        activeCategoryId="c-abstract"
        categoryUnavailable={false}
      />,
    )

    // Managed alt text is used when present, Painting title is the fallback.
    expect(markup).toContain('alt="A field of tulips"')
    expect(markup).toContain('alt="Serenity"')
    // Gallery links lead to the Painting detail URL.
    expect(markup).toContain('href="/paintings/painting-1"')
    expect(markup).toContain('/resources/note-images/image-1')
    // Category filter links retain the ?q=<categoryId> URL contract.
    expect(markup).toContain('href="/paintings?q=c-abstract"')
    expect(markup).toContain('href="/paintings?q=c-portraits"')
    expect(markup).toContain('aria-current="page"')
  })

  it('explains an unavailable Category instead of an empty gallery', () => {
    const markup = renderToStaticMarkup(
      <GalleryView
        categories={[{ id: 'c-abstract', label: 'Abstract' }]}
        paintings={[]}
        activeCategoryId="deleted-category"
        categoryUnavailable={true}
      />,
    )

    expect(markup).toContain('no longer available')
  })
})
