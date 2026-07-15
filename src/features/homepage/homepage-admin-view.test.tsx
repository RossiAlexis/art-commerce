import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HomepageAdminView } from './homepage-admin-view'

const noop = () => {}

const baseProps = {
  username: 'vero',
  status: { kind: 'idle' as const },
  pending: false,
  onSaveContent: noop,
  onUploadImage: noop,
  onDescribeImage: noop,
  onRemoveImage: noop,
}

describe('HomepageAdminView', () => {
  it('pre-fills the singleton title and text for editing', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView
        {...baseProps}
        homepage={{
          id: 'seed-homepage',
          title: '¡Hola!',
          text: 'Welcome to my portfolio.',
          image: null,
        }}
      />,
    )

    expect(markup).toContain('value="¡Hola!"')
    expect(markup).toContain('Welcome to my portfolio.')
    // Text-only Homepage: no image preview is shown.
    expect(markup).not.toContain('/resources/homepage-image/')
  })

  it('previews the existing image with its stored alt text and offers removal', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView
        {...baseProps}
        homepage={{
          id: 'seed-homepage',
          title: 'Title',
          text: 'Text',
          image: { id: 'home-image-1', altText: 'Vero in her studio' },
        }}
      />,
    )

    expect(markup).toContain('/resources/homepage-image/home-image-1')
    expect(markup).toContain('Vero in her studio')
    expect(markup).toContain('Remove image')
  })

  it('surfaces a success notification after a mutation', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView
        {...baseProps}
        homepage={{
          id: 'seed-homepage',
          title: 'Title',
          text: 'Text',
          image: null,
        }}
        status={{ kind: 'success', message: 'Homepage updated.' }}
      />,
    )

    expect(markup).toContain('Homepage updated.')
    expect(markup).toContain('role="status"')
  })

  it('surfaces a failure notification', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView
        {...baseProps}
        homepage={{
          id: 'seed-homepage',
          title: 'Title',
          text: 'Text',
          image: null,
        }}
        status={{ kind: 'error', message: 'Something went wrong.' }}
      />,
    )

    expect(markup).toContain('Something went wrong.')
    expect(markup).toContain('role="alert"')
  })
})
