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
  })
})
