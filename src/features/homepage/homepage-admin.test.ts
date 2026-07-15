import { describe, expect, it } from 'vitest'

import {
  MAX_HOMEPAGE_IMAGE_BYTES,
  describeHomepageImage,
  homepageContentSchema,
  loadAdminHomepage,
  removeHomepageImage,
  saveHomepageContent,
  saveHomepageImage,
  validateHomepageImage,
} from './homepage-admin'
import type {
  AdminHomepageRecord,
  HomepageAdminRepository,
  NewHomepageImage,
} from './homepage-admin'

function createFakeRepository(
  initial: AdminHomepageRecord | null,
): HomepageAdminRepository & { record: AdminHomepageRecord | null } {
  const state = { record: initial ? { ...initial } : null }

  return {
    get record() {
      return state.record
    },
    async getSingleton() {
      return state.record ? { ...state.record } : null
    },
    async updateContent({ id, title, text }) {
      if (!state.record || state.record.id !== id) {
        throw new Error('unexpected id')
      }
      state.record = { ...state.record, title, text }
      return { ...state.record }
    },
    async putImage({ homepageId, image }) {
      if (!state.record || state.record.id !== homepageId) {
        throw new Error('unexpected homepageId')
      }
      state.record = {
        ...state.record,
        image: { id: 'image-generated', altText: image.altText },
      }
      return { ...state.record }
    },
    async updateImageAltText({ homepageId, altText }) {
      if (
        !state.record ||
        state.record.id !== homepageId ||
        !state.record.image
      ) {
        throw new Error('no image to describe')
      }
      state.record = {
        ...state.record,
        image: { ...state.record.image, altText },
      }
      return { ...state.record }
    },
    async removeImage({ homepageId }) {
      if (!state.record || state.record.id !== homepageId) {
        throw new Error('unexpected homepageId')
      }
      state.record = { ...state.record, image: null }
      return { ...state.record }
    },
  }
}

const singleton: AdminHomepageRecord = {
  id: 'seed-homepage',
  title: '¡Hola!',
  text: 'Welcome to my art portfolio.',
  image: null,
}

function newImage(overrides: Partial<NewHomepageImage> = {}): NewHomepageImage {
  return {
    contentType: 'image/png',
    altText: 'A studio portrait',
    bytes: Uint8Array.from([1, 2, 3, 4]),
    ...overrides,
  }
}

describe('homepageContentSchema', () => {
  it('accepts and trims a valid title and text', () => {
    const parsed = homepageContentSchema.parse({
      title: '  Hello  ',
      text: '  Welcome  ',
    })
    expect(parsed).toEqual({ title: 'Hello', text: 'Welcome' })
  })

  it('rejects empty or whitespace-only fields', () => {
    expect(
      homepageContentSchema.safeParse({ title: '', text: 'x' }).success,
    ).toBe(false)
    expect(
      homepageContentSchema.safeParse({ title: 'x', text: '   ' }).success,
    ).toBe(false)
  })
})

describe('validateHomepageImage', () => {
  it('accepts a supported type within the payload limit', () => {
    expect(
      validateHomepageImage({ contentType: 'image/webp', byteLength: 1024 }),
    ).toEqual({ ok: true })
  })

  it('rejects an unsupported content type', () => {
    const result = validateHomepageImage({
      contentType: 'image/gif',
      byteLength: 1024,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects an empty upload', () => {
    expect(
      validateHomepageImage({ contentType: 'image/png', byteLength: 0 }).ok,
    ).toBe(false)
  })

  it('rejects a payload larger than the hosting limit', () => {
    expect(
      validateHomepageImage({
        contentType: 'image/png',
        byteLength: MAX_HOMEPAGE_IMAGE_BYTES + 1,
      }).ok,
    ).toBe(false)
  })
})

describe('loadAdminHomepage', () => {
  it('returns the existing singleton record', async () => {
    const repository = createFakeRepository(singleton)
    expect(await loadAdminHomepage(repository)).toEqual(singleton)
  })

  it('returns null when no Homepage record exists', async () => {
    const repository = createFakeRepository(null)
    expect(await loadAdminHomepage(repository)).toBeNull()
  })
})

describe('saveHomepageContent', () => {
  it('updates the singleton in place without creating another record', async () => {
    const repository = createFakeRepository(singleton)
    const result = await saveHomepageContent(repository, {
      title: 'New title',
      text: 'New text',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.homepage.title).toBe('New title')
      expect(result.homepage.text).toBe('New text')
    }
    expect(repository.record?.id).toBe('seed-homepage')
  })

  it('reports validation errors instead of writing', async () => {
    const repository = createFakeRepository(singleton)
    const result = await saveHomepageContent(repository, {
      title: '',
      text: '',
    })

    expect(result.ok).toBe(false)
    expect(repository.record?.title).toBe('¡Hola!')
  })
})

describe('homepage image lifecycle', () => {
  it('adds an image when none exists', async () => {
    const repository = createFakeRepository(singleton)
    const result = await saveHomepageImage(repository, { image: newImage() })

    expect(result.ok).toBe(true)
    expect(repository.record?.image).toEqual({
      id: 'image-generated',
      altText: 'A studio portrait',
    })
  })

  it('replaces an existing image', async () => {
    const repository = createFakeRepository({
      ...singleton,
      image: { id: 'old-image', altText: 'old' },
    })
    const result = await saveHomepageImage(repository, {
      image: newImage({ altText: 'replacement' }),
    })

    expect(result.ok).toBe(true)
    expect(repository.record?.image?.id).toBe('image-generated')
    expect(repository.record?.image?.altText).toBe('replacement')
  })

  it('rejects an invalid image without writing', async () => {
    const repository = createFakeRepository(singleton)
    const result = await saveHomepageImage(repository, {
      image: newImage({ contentType: 'application/pdf' }),
    })

    expect(result.ok).toBe(false)
    expect(repository.record?.image).toBeNull()
  })

  it('describes an existing image with new alt text', async () => {
    const repository = createFakeRepository({
      ...singleton,
      image: { id: 'img', altText: null },
    })
    const result = await describeHomepageImage(repository, {
      altText: 'Updated description',
    })

    expect(result.ok).toBe(true)
    expect(repository.record?.image?.altText).toBe('Updated description')
  })

  it('cannot describe a missing image', async () => {
    const repository = createFakeRepository(singleton)
    const result = await describeHomepageImage(repository, { altText: 'x' })
    expect(result.ok).toBe(false)
  })

  it('removes an existing image', async () => {
    const repository = createFakeRepository({
      ...singleton,
      image: { id: 'img', altText: 'alt' },
    })
    const result = await removeHomepageImage(repository)

    expect(result.ok).toBe(true)
    expect(repository.record?.image).toBeNull()
  })

  it('treats removing an absent image as a no-op success', async () => {
    const repository = createFakeRepository(singleton)
    const result = await removeHomepageImage(repository)
    expect(result.ok).toBe(true)
    expect(repository.record?.image).toBeNull()
  })
})
