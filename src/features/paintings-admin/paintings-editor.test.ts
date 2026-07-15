import { describe, expect, it } from 'vitest'

import {
  MAX_PAINTING_IMAGE_BYTES,
  addManagedPaintingImage,
  createManagedPainting,
  describeManagedPaintingImage,
  detectImageType,
  parsePaintingFields,
  removeManagedPaintingImage,
  reorderManagedPaintingImages,
  replaceManagedPaintingImage,
  updateManagedPaintingFields,
  validatePaintingImage,
} from './paintings-editor'
import type {
  NewPaintingImage,
  PaintingEditorRepository,
  PaintingFieldsInput,
} from './paintings-editor'

const validFields: PaintingFieldsInput = {
  title: 'Sunset',
  price: 'CAD 1,200',
  measures: '30 x 40 cm',
  categoryId: 'cat-1',
  content: 'A warm evening.',
}

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
])
const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const WEBP_HEADER = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])

describe('parsePaintingFields', () => {
  it('accepts and trims all five required fields', () => {
    const result = parsePaintingFields({
      title: '  Sunset  ',
      price: ' CAD 1,200 ',
      measures: ' 30 x 40 cm ',
      categoryId: ' cat-1 ',
      content: ' A warm evening. ',
    })
    expect(result).toEqual({
      ok: true,
      data: {
        title: 'Sunset',
        price: 'CAD 1,200',
        measures: '30 x 40 cm',
        categoryId: 'cat-1',
        content: 'A warm evening.',
      },
    })
  })

  it('reports a per-field error for each missing required field', () => {
    const result = parsePaintingFields({
      title: '',
      price: '   ',
      measures: '',
      categoryId: '',
      content: '',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.errors).sort()).toEqual([
      'categoryId',
      'content',
      'measures',
      'price',
      'title',
    ])
  })
})

describe('detectImageType', () => {
  it('recognises JPEG, PNG, and WebP signatures', () => {
    expect(detectImageType(JPEG_HEADER)).toBe('image/jpeg')
    expect(detectImageType(PNG_HEADER)).toBe('image/png')
    expect(detectImageType(WEBP_HEADER)).toBe('image/webp')
  })

  it('returns null for SVG and other non-raster content', () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" />',
    )
    expect(detectImageType(svg)).toBeNull()
    expect(detectImageType(new Uint8Array([0x00, 0x01, 0x02]))).toBeNull()
  })
})

describe('validatePaintingImage', () => {
  it('accepts a supported image and returns its sniffed content type', () => {
    const result = validatePaintingImage({
      contentType: 'image/png',
      bytes: PNG_HEADER,
    })
    expect(result).toEqual({ ok: true, contentType: 'image/png' })
  })

  it('trusts the sniffed bytes over an empty declared type', () => {
    const result = validatePaintingImage({
      contentType: '',
      bytes: JPEG_HEADER,
    })
    expect(result).toEqual({ ok: true, contentType: 'image/jpeg' })
  })

  it('rejects a spoofed content type that disagrees with the bytes', () => {
    const result = validatePaintingImage({
      contentType: 'image/png',
      bytes: JPEG_HEADER,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects SVG content declared as an allowed type', () => {
    const svg = new TextEncoder().encode('<svg onload="alert(1)" />')
    const result = validatePaintingImage({
      contentType: 'image/png',
      bytes: svg,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects an empty upload', () => {
    expect(
      validatePaintingImage({
        contentType: 'image/png',
        bytes: new Uint8Array(),
      }).ok,
    ).toBe(false)
  })

  it('rejects a payload over the hosting limit', () => {
    const bytes = new Uint8Array(MAX_PAINTING_IMAGE_BYTES + 1)
    bytes.set(PNG_HEADER)
    expect(validatePaintingImage({ contentType: 'image/png', bytes }).ok).toBe(
      false,
    )
  })
})

describe('createManagedPainting', () => {
  it('creates a Painting from valid fields', async () => {
    const repo = fakeRepository()
    const result = await createManagedPainting(repo, validFields)
    expect(result).toEqual({ ok: true, id: 'painting-1' })
    expect(repo.paintings).toHaveLength(1)
    expect(repo.paintings[0].fields.title).toBe('Sunset')
  })

  it('reports validation errors instead of writing', async () => {
    const repo = fakeRepository()
    const result = await createManagedPainting(repo, {
      ...validFields,
      title: '',
    })
    expect(result.ok).toBe(false)
    expect(repo.paintings).toHaveLength(0)
  })
})

describe('updateManagedPaintingFields', () => {
  it('updates an existing Painting', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)
    const result = await updateManagedPaintingFields(repo, id, {
      ...validFields,
      title: 'Autumn',
    })
    expect(result).toEqual({ ok: true, id })
    expect(repo.paintings[0].fields.title).toBe('Autumn')
  })

  it('returns null when the Painting no longer exists', async () => {
    const repo = fakeRepository()
    const result = await updateManagedPaintingFields(
      repo,
      'missing',
      validFields,
    )
    expect(result).toBeNull()
  })

  it('reports validation errors without touching the record', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)
    const result = await updateManagedPaintingFields(repo, id, {
      ...validFields,
      measures: '',
    })
    expect(result?.ok).toBe(false)
    expect(repo.paintings[0].fields.measures).toBe('30 x 40 cm')
  })
})

describe('image lifecycle', () => {
  it('adds images in append order', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)

    const first = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: { contentType: 'image/png', altText: 'front', bytes: PNG_HEADER },
    })
    const second = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: { contentType: 'image/jpeg', altText: null, bytes: JPEG_HEADER },
    })

    expect(first.ok && second.ok).toBe(true)
    const images = repo.paintings[0].images
    expect(images.map((i) => i.order)).toEqual([0, 1])
    expect(images[0].altText).toBe('front')
  })

  it('does not add an image to a missing Painting', async () => {
    const repo = fakeRepository()
    const result = await addManagedPaintingImage(repo, {
      paintingId: 'missing',
      image: { contentType: 'image/png', altText: null, bytes: PNG_HEADER },
    })
    expect(result.ok).toBe(false)
  })

  it('rejects an invalid image without writing', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)
    const result = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: {
        contentType: 'image/png',
        altText: null,
        bytes: new TextEncoder().encode('<svg />'),
      },
    })
    expect(result.ok).toBe(false)
    expect(repo.paintings[0].images).toHaveLength(0)
  })

  it('replaces an image with a new cache-safe identifier and no orphan', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)
    const added = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: { contentType: 'image/png', altText: 'front', bytes: PNG_HEADER },
    })
    const originalId = added.ok ? added.imageId : undefined

    const result = await replaceManagedPaintingImage(repo, {
      imageId: originalId!,
      image: { contentType: 'image/jpeg', altText: null, bytes: JPEG_HEADER },
    })

    expect(result.ok).toBe(true)
    const images = repo.paintings[0].images
    expect(images).toHaveLength(1)
    expect(images[0].id).not.toBe(originalId)
    expect(images[0].order).toBe(0)
    expect(images[0].contentType).toBe('image/jpeg')
  })

  it('describes an existing image', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)
    const added = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: { contentType: 'image/png', altText: null, bytes: PNG_HEADER },
    })
    const imageId = added.ok ? added.imageId! : ''

    const result = await describeManagedPaintingImage(repo, {
      imageId,
      altText: '  detailed view  ',
    })
    expect(result.ok).toBe(true)
    expect(repo.paintings[0].images[0].altText).toBe('detailed view')
  })

  it('reorders a Painting images by the provided id list', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)
    const a = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: { contentType: 'image/png', altText: null, bytes: PNG_HEADER },
    })
    const b = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: { contentType: 'image/jpeg', altText: null, bytes: JPEG_HEADER },
    })
    const aId = a.ok ? a.imageId! : ''
    const bId = b.ok ? b.imageId! : ''

    const result = await reorderManagedPaintingImages(repo, {
      paintingId: id,
      orderedImageIds: [bId, aId],
    })
    expect(result.ok).toBe(true)
    const byId = new Map(repo.paintings[0].images.map((i) => [i.id, i.order]))
    expect(byId.get(bId)).toBe(0)
    expect(byId.get(aId)).toBe(1)
  })

  it('removes an image, leaving an image-less Painting manageable', async () => {
    const repo = fakeRepository()
    const { id } = await repo.createPainting(validFields)
    const added = await addManagedPaintingImage(repo, {
      paintingId: id,
      image: { contentType: 'image/png', altText: null, bytes: PNG_HEADER },
    })
    const imageId = added.ok ? added.imageId! : ''

    const result = await removeManagedPaintingImage(repo, imageId)
    expect(result.ok).toBe(true)
    expect(repo.paintings[0].images).toHaveLength(0)
  })

  it('reports a missing image on remove', async () => {
    const repo = fakeRepository()
    const result = await removeManagedPaintingImage(repo, 'missing')
    expect(result.ok).toBe(false)
  })
})

type FakeImage = NewPaintingImage & { id: string; order: number }
type FakePainting = {
  id: string
  fields: PaintingFieldsInput
  images: Array<FakeImage>
}
type FakeRepository = PaintingEditorRepository & {
  paintings: Array<FakePainting>
}

function fakeRepository(): FakeRepository {
  const paintings: Array<FakePainting> = []
  let paintingSeq = 0
  let imageSeq = 0

  function find(id: string) {
    return paintings.find((p) => p.id === id) ?? null
  }
  function findByImage(imageId: string) {
    return paintings.find((p) => p.images.some((i) => i.id === imageId)) ?? null
  }

  return {
    paintings,
    async createPainting(fields) {
      paintingSeq += 1
      const painting: FakePainting = {
        id: `painting-${paintingSeq}`,
        fields,
        images: [],
      }
      paintings.push(painting)
      return { id: painting.id }
    },
    async updatePainting(id, fields) {
      const painting = find(id)
      if (!painting) return false
      painting.fields = fields
      return true
    },
    async addImage({ paintingId, image }) {
      const painting = find(paintingId)
      if (!painting) return null
      imageSeq += 1
      const order =
        painting.images.reduce((max, i) => Math.max(max, i.order), -1) + 1
      const created: FakeImage = { ...image, id: `image-${imageSeq}`, order }
      painting.images.push(created)
      return { id: created.id }
    },
    async replaceImage({ imageId, image }) {
      const painting = findByImage(imageId)
      if (!painting) return null
      const index = painting.images.findIndex((i) => i.id === imageId)
      const previous = painting.images[index]
      imageSeq += 1
      const created: FakeImage = {
        ...image,
        altText: image.altText ?? previous.altText,
        id: `image-${imageSeq}`,
        order: previous.order,
      }
      painting.images.splice(index, 1, created)
      return { id: created.id }
    },
    async describeImage({ imageId, altText }) {
      const painting = findByImage(imageId)
      if (!painting) return false
      const image = painting.images.find((i) => i.id === imageId)!
      image.altText = altText
      return true
    },
    async reorderImages({ paintingId, orderedImageIds }) {
      const painting = find(paintingId)
      if (!painting) return false
      const owned = new Set(painting.images.map((i) => i.id))
      if (
        orderedImageIds.length !== painting.images.length ||
        !orderedImageIds.every((id) => owned.has(id))
      ) {
        return false
      }
      orderedImageIds.forEach((id, order) => {
        painting.images.find((i) => i.id === id)!.order = order
      })
      return true
    },
    async removeImage(imageId) {
      const painting = findByImage(imageId)
      if (!painting) return false
      painting.images = painting.images.filter((i) => i.id !== imageId)
      return true
    },
  }
}
