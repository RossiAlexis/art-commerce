import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  DeletePaintingForm,
  PaintingDetailView,
  PaintingListView,
} from './paintings-admin-view'

describe('PaintingListView', () => {
  it('lists Paintings with their image count and links to management', () => {
    const markup = renderToStaticMarkup(
      <PaintingListView
        username="vero"
        paintings={[{ id: 'p-sunset', title: 'Sunset', imageCount: 2 }]}
      />,
    )

    expect(markup).toContain('Sunset')
    expect(markup).toContain('2 images')
    expect(markup).toContain('href="/administration/vero/paintings/p-sunset"')
  })

  it('renders a useful empty index state when there are no Paintings', () => {
    const markup = renderToStaticMarkup(
      <PaintingListView username="vero" paintings={[]} />,
    )

    expect(markup).toContain('No Paintings yet')
  })
})

describe('PaintingDetailView', () => {
  it('shows managed fields and ordered images', () => {
    const markup = renderToStaticMarkup(
      <PaintingDetailView
        username="vero"
        painting={{
          id: 'p-sunset',
          title: 'Sunset',
          price: '1200',
          measures: '30x40cm',
          content: 'A warm evening.',
          categoryName: 'Landscapes',
          images: [
            { id: 'image-1', altText: 'front', order: 0 },
            { id: 'image-2', altText: null, order: 1 },
          ],
        }}
      />,
    )

    expect(markup).toContain('Sunset')
    expect(markup).toContain('1200')
    expect(markup).toContain('30x40cm')
    expect(markup).toContain('A warm evening.')
    expect(markup).toContain('Landscapes')
    expect(markup).toContain('/resources/note-images/image-1')
    expect(markup).toContain('/resources/note-images/image-2')
    // The delete affordance is present on the detail page.
    expect(markup).toContain('Delete painting')
  })

  it('flags an image-less Painting as absent from public pages', () => {
    const markup = renderToStaticMarkup(
      <PaintingDetailView
        username="vero"
        painting={{
          id: 'p-draft',
          title: 'Draft',
          price: '0',
          measures: null,
          content: '',
          categoryName: null,
          images: [],
        }}
      />,
    )

    expect(markup).toContain('does not appear on public pages')
    expect(markup).toContain('Uncategorized')
  })
})

describe('DeletePaintingForm', () => {
  it('warns that the Painting and its images will be removed', () => {
    const markup = renderToStaticMarkup(
      <DeletePaintingForm paintingTitle="Sunset" imageCount={2} />,
    )

    expect(markup).toContain('Sunset')
    expect(markup).toContain('2 images')
    expect(markup).toMatch(/cannot be undone/i)
  })
})
