import { describe, expect, it } from 'vitest'

import { loadGallery, parseGallerySearch } from './gallery'
import type { GalleryCategory, GalleryPainting } from './gallery'

describe('parseGallerySearch', () => {
  it('keeps a Category id filter', () => {
    expect(parseGallerySearch({ q: 'category-1' })).toEqual({ q: 'category-1' })
  })

  it('trims surrounding whitespace from the filter', () => {
    expect(parseGallerySearch({ q: '  category-1  ' })).toEqual({
      q: 'category-1',
    })
  })

  it('drops an empty or whitespace-only filter', () => {
    expect(parseGallerySearch({ q: '   ' })).toEqual({ q: undefined })
    expect(parseGallerySearch({})).toEqual({ q: undefined })
  })

  it('ignores a malformed non-string filter', () => {
    expect(parseGallerySearch({ q: ['a', 'b'] })).toEqual({ q: undefined })
  })
})

describe('loadGallery', () => {
  it('server-renders only visible Paintings ordered by creation time', async () => {
    const result = await loadGallery(
      {
        listCategories: async () => [],
        listPaintings: async () => [
          painting('third', '2024-01-03', ['image-3']),
          painting('hidden', '2024-01-01', []),
          painting('first', '2024-01-01', ['image-1']),
          painting('second', '2024-01-02', ['image-2']),
        ],
      },
      { q: undefined },
    )

    expect(result.paintings.map(({ id }) => id)).toEqual([
      'first',
      'second',
      'third',
    ])
    expect(result.activeCategoryId).toBeNull()
    expect(result.categoryUnavailable).toBe(false)
  })

  it('uses the Painting id to break equal creation-time ties', async () => {
    const result = await loadGallery(
      {
        listCategories: async () => [],
        listPaintings: async () => [
          painting('zebra', '2024-01-01', ['image-z']),
          painting('alpha', '2024-01-01', ['image-a']),
        ],
      },
      { q: undefined },
    )

    expect(result.paintings.map(({ id }) => id)).toEqual(['alpha', 'zebra'])
  })

  it('sorts Categories alphabetically by public navigation label', async () => {
    const result = await loadGallery(
      {
        listCategories: async () => [
          category('c-portraits', 'Portraits'),
          category('c-abstract', 'Abstract'),
          category('c-landscapes', 'Landscapes'),
        ],
        listPaintings: async () => [],
      },
      { q: undefined },
    )

    expect(result.categories.map(({ label }) => label)).toEqual([
      'Abstract',
      'Landscapes',
      'Portraits',
    ])
  })

  it('filters Paintings by the requested Category', async () => {
    const requested: Array<string | null> = []
    const result = await loadGallery(
      {
        listCategories: async () => [category('c-abstract', 'Abstract')],
        listPaintings: async (categoryId) => {
          requested.push(categoryId)
          return [painting('kept', '2024-01-01', ['image-1'])]
        },
      },
      { q: 'c-abstract' },
    )

    expect(requested).toEqual(['c-abstract'])
    expect(result.activeCategoryId).toBe('c-abstract')
    expect(result.categoryUnavailable).toBe(false)
    expect(result.paintings.map(({ id }) => id)).toEqual(['kept'])
  })

  it('preserves the URL and empties the gallery for an unavailable Category', async () => {
    let paintingsQueried = false
    const result = await loadGallery(
      {
        listCategories: async () => [category('c-abstract', 'Abstract')],
        listPaintings: async () => {
          paintingsQueried = true
          return [painting('kept', '2024-01-01', ['image-1'])]
        },
      },
      { q: 'deleted-category' },
    )

    expect(result.activeCategoryId).toBe('deleted-category')
    expect(result.categoryUnavailable).toBe(true)
    expect(result.paintings).toEqual([])
    expect(paintingsQueried).toBe(false)
  })
})

function painting(
  id: string,
  createdAt: string,
  imageIds: Array<string>,
): GalleryPainting {
  return {
    id,
    title: id,
    createdAt: new Date(`${createdAt}T00:00:00.000Z`),
    images: imageIds.map((imageId) => ({ id: imageId, altText: null })),
  }
}

function category(id: string, label: string): GalleryCategory {
  return { id, label }
}
