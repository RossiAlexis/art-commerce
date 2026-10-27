// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

const emptyHomepage = {
  id: 'seed-homepage',
  title: '¡Hola!',
  text: 'Welcome to my portfolio.',
  image: null,
  hero: null,
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('HomepageAdminView', () => {
  it('pre-fills the singleton title and text for editing', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView {...baseProps} homepage={emptyHomepage} />,
    )

    expect(markup).toContain('value="¡Hola!"')
    expect(markup).toContain('Welcome to my portfolio.')
    expect(markup).toContain('No hero image is set')
    expect(markup).toContain('No intro image is set')
    expect(markup).not.toContain('/resources/homepage-image/')
    expect(markup).not.toContain('aspect-1440/580')
    expect(markup).not.toContain('Desktop preview')
  })

  it('frames the hero miniature as the 1440/580 desktop crop', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView
        {...baseProps}
        homepage={{
          ...emptyHomepage,
          title: 'Title',
          text: 'Text',
          hero: { id: 'hero-1', altText: 'Studio banner' },
        }}
      />,
    )

    expect(markup).toContain('aspect-1440/580')
    expect(markup).toContain('Desktop preview')
    const hero = imgTag(markup, '/resources/homepage-image/hero-1')
    expect(hero).toContain('h-full')
    expect(hero).toContain('w-full')
    expect(hero).toContain('object-cover')
    expect(hero).toContain('object-center')
    expect(hero).toContain('alt="Studio banner"')
    expect(markup).toContain('Remove image')
  })

  it('frames the intro miniature at the desktop width without the hero crop', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView
        {...baseProps}
        homepage={{
          ...emptyHomepage,
          title: 'Title',
          text: 'Text',
          image: { id: 'intro-1', altText: 'Vero in her studio' },
          hero: { id: 'hero-1', altText: 'Studio banner' },
        }}
      />,
    )

    const intro = imgTag(markup, '/resources/homepage-image/intro-1')
    expect(intro).toContain('w-64')
    expect(intro).toContain('rounded-sm')
    expect(intro).toContain('object-cover')
    expect(intro).toContain('shadow-sm')
    expect(intro).not.toContain('1440')
    expect(intro).not.toContain('aspect-1440/580')
    expect(intro).toContain('alt="Vero in her studio"')
    expect(markup).toContain('Remove image')
    expect(markup).toContain('aspect-1440/580')
  })

  it('shows a chosen file in that slot desktop frame before save', () => {
    const revokeObjectURL = vi.fn()
    let previewCount = 0
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => `blob:preview-${++previewCount}`),
      revokeObjectURL,
    })

    const view = render(
      <HomepageAdminView {...baseProps} homepage={emptyHomepage} />,
    )

    const heroInput = document.getElementById('hero-image')
    const introInput = document.getElementById('intro-image')
    expect(heroInput).toBeInstanceOf(HTMLInputElement)
    expect(introInput).toBeInstanceOf(HTMLInputElement)

    const file = new File([new Uint8Array([1, 2, 3])], 'banner.png', {
      type: 'image/png',
    })
    fireEvent.change(heroInput as HTMLInputElement, {
      target: { files: [file] },
    })

    const heroPreview = document.querySelector('img[src="blob:preview-1"]')
    expect(heroPreview).not.toBeNull()
    expect(heroPreview?.getAttribute('class')).toContain('object-cover')
    expect(heroPreview?.getAttribute('class')).toContain('object-center')
    expect(heroPreview?.parentElement?.getAttribute('class')).toContain(
      'aspect-1440/580',
    )
    expect(view.container.textContent).toContain('Desktop preview')

    fireEvent.change(heroInput as HTMLInputElement, {
      target: { files: [file] },
    })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')

    fireEvent.change(introInput as HTMLInputElement, {
      target: { files: [file] },
    })
    const introPreview = document.querySelector('img[src="blob:preview-3"]')
    expect(introPreview?.getAttribute('class')).toContain('w-64')
    expect(introPreview?.getAttribute('class')).not.toContain('1440')

    view.unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-2')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-3')
  })

  it('surfaces a success notification after a mutation', () => {
    const markup = renderToStaticMarkup(
      <HomepageAdminView
        {...baseProps}
        homepage={{ ...emptyHomepage, title: 'Title', text: 'Text' }}
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
        homepage={{ ...emptyHomepage, title: 'Title', text: 'Text' }}
        status={{ kind: 'error', message: 'Something went wrong.' }}
      />,
    )

    expect(markup).toContain('Something went wrong.')
    expect(markup).toContain('role="alert"')
  })
})

function imgTag(markup: string, srcFragment: string) {
  const tag = (markup.match(/<img\b[^>]*>/g) ?? []).find((candidate) =>
    candidate.includes(srcFragment),
  )
  expect(tag).toBeDefined()
  return tag ?? ''
}
