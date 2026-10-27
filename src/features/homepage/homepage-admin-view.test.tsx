// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
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

  it('replaces the local preview with the stored image after that slot saves', async () => {
    const { revokeObjectURL } = stubPreviewUrls()
    const onUploadImage = vi.fn(() => Promise.resolve({ ok: true as const }))
    const homepage = {
      ...emptyHomepage,
      title: 'Title',
      text: 'Text',
      hero: { id: 'hero-1', altText: 'Studio banner' },
    }
    render(
      <HomepageAdminView
        {...baseProps}
        homepage={homepage}
        onUploadImage={onUploadImage}
      />,
    )

    const heroInput = chooseImage('hero-image', 'banner.png')
    chooseImage('intro-image', 'portrait.png')
    expect(document.querySelector('img[src="blob:preview-1"]')).not.toBeNull()
    expect(document.querySelector('img[src="blob:preview-2"]')).not.toBeNull()

    await act(async () => {
      fireEvent.submit(heroInput.form!)
    })

    expect(onUploadImage).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')
    expect(document.querySelector('img[src="blob:preview-1"]')).toBeNull()
    expect(
      document.querySelector('img[src="/resources/homepage-image/hero-1"]'),
    ).not.toBeNull()
    expect(heroInput.value).toBe('')
    // The other slot's unsaved preview stays until that slot succeeds.
    expect(document.querySelector('img[src="blob:preview-2"]')).not.toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:preview-2')

    await act(async () => {
      fireEvent.submit(heroInput.form!)
    })
    expect(onUploadImage).toHaveBeenCalledOnce()
  })

  it('clears the local preview after that slot is removed', async () => {
    const { revokeObjectURL } = stubPreviewUrls()
    const onRemoveImage = vi.fn(() => Promise.resolve({ ok: true as const }))
    const homepage = {
      ...emptyHomepage,
      hero: { id: 'hero-1', altText: 'Studio banner' },
    }
    const view = render(
      <HomepageAdminView
        {...baseProps}
        homepage={homepage}
        onRemoveImage={onRemoveImage}
      />,
    )

    const heroInput = chooseImage('hero-image', 'banner.png')
    const hero = sectionNamed('Hero')
    const remove = [...hero.querySelectorAll('button')].find(
      (button) => button.textContent === 'Remove image',
    )
    expect(remove).toBeDefined()

    await act(async () => {
      fireEvent.click(remove!)
    })

    expect(onRemoveImage).toHaveBeenCalledWith('hero')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')
    expect(document.querySelector('img[src="blob:preview-1"]')).toBeNull()
    expect(heroInput.value).toBe('')

    view.rerender(
      <HomepageAdminView
        {...baseProps}
        homepage={emptyHomepage}
        onRemoveImage={onRemoveImage}
      />,
    )
    expect(view.container.textContent).toContain('No hero image is set')
    expect(document.querySelector('img[src="blob:preview-1"]')).toBeNull()
    expect(
      document.querySelector('img[src="/resources/homepage-image/hero-1"]'),
    ).toBeNull()
  })

  it('keeps the chosen file when that slot upload or remove fails', async () => {
    const { revokeObjectURL } = stubPreviewUrls()
    const onUploadImage = vi.fn(() => Promise.resolve({ ok: false as const }))
    const onRemoveImage = vi.fn(() => Promise.resolve({ ok: false as const }))
    render(
      <HomepageAdminView
        {...baseProps}
        homepage={{
          ...emptyHomepage,
          hero: { id: 'hero-1', altText: 'Studio banner' },
        }}
        onUploadImage={onUploadImage}
        onRemoveImage={onRemoveImage}
      />,
    )

    const heroInput = chooseImage('hero-image', 'banner.png')
    await act(async () => {
      fireEvent.submit(heroInput.form!)
    })
    expect(onUploadImage).toHaveBeenCalledOnce()
    expect(document.querySelector('img[src="blob:preview-1"]')).not.toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    const remove = [...sectionNamed('Hero').querySelectorAll('button')].find(
      (button) => button.textContent === 'Remove image',
    )
    await act(async () => {
      fireEvent.click(remove!)
    })
    expect(onRemoveImage).toHaveBeenCalledWith('hero')
    expect(document.querySelector('img[src="blob:preview-1"]')).not.toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()
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

function stubPreviewUrls() {
  const revokeObjectURL = vi.fn()
  let previewCount = 0
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => `blob:preview-${++previewCount}`),
    revokeObjectURL,
  })
  return { revokeObjectURL }
}

function chooseImage(id: string, name: string) {
  const input = document.getElementById(id)
  expect(input).toBeInstanceOf(HTMLInputElement)
  const element = input as HTMLInputElement
  const file = new File([new Uint8Array([1, 2, 3])], name, {
    type: 'image/png',
  })
  fireEvent.change(element, { target: { files: [file] } })
  return element
}

function sectionNamed(name: string) {
  const heading = [...document.querySelectorAll('h2')].find(
    (node) => node.textContent === name,
  )
  const section = heading?.closest('section')
  expect(section).toBeInstanceOf(HTMLElement)
  return section as HTMLElement
}

function imgTag(markup: string, srcFragment: string) {
  const tag = (markup.match(/<img\b[^>]*>/g) ?? []).find((candidate) =>
    candidate.includes(srcFragment),
  )
  expect(tag).toBeDefined()
  return tag ?? ''
}
