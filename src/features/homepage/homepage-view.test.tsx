import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HomepageView } from './homepage-view'

describe('HomepageView', () => {
  it('renders a text-only Homepage and Painting title fallbacks', () => {
    const markup = renderToStaticMarkup(
      <HomepageView
        homepage={{
          title: '¡Hola!',
          text: 'Welcome to my portfolio.',
          image: null,
          hero: { id: 'hero-1', altText: 'Banner' },
        }}
        paintings={[
          {
            id: 'painting-1',
            title: 'Blooming',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            images: [{ id: 'image-1', altText: null }],
          },
        ]}
      />,
    )

    expect(markup).toContain('¡Hola!')
    expect(markup).toContain('Welcome to my portfolio.')
    expect(markup).toContain('alt="Blooming"')
    expect(markup).toContain('/resources/note-images/image-1')
    // The hero banner is rendered by the homepage route, not this block.
    expect(markup).not.toContain('/resources/homepage-image/hero-1')
    expect(markup).not.toContain('aspect-1440/580')
  })

  it('renders the intro image at its natural desktop width', () => {
    const markup = renderToStaticMarkup(
      <HomepageView
        homepage={{
          title: '¡Hola!',
          text: 'Welcome to my portfolio.',
          image: { id: 'intro-1', altText: null },
          hero: null,
        }}
        paintings={[]}
      />,
    )

    const intro = (markup.match(/<img\b[^>]*>/g) ?? []).find((tag) =>
      tag.includes('/resources/homepage-image/intro-1'),
    )
    expect(intro).toContain('md:w-64')
    expect(intro).toContain('aspect-auto')
    expect(intro).toContain('object-cover')
    expect(intro).not.toContain('1440')
    expect(markup).toContain('alt="¡Hola!"')
  })
})
