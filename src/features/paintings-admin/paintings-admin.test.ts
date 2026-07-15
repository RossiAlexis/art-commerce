import { describe, expect, it } from 'vitest'

import {
  deleteManagedPainting,
  listPaintingsForManagement,
  loadManagedPainting,
  orderPaintingImages,
  sortManagedPaintings,
} from './paintings-admin'
import type {
  ManagedPaintingRecord,
  ManagedPaintingRepository,
  ManagedPaintingSummary,
} from './paintings-admin'

describe('sortManagedPaintings', () => {
  it('orders Paintings alphabetically by title', () => {
    const sorted = sortManagedPaintings([
      summary('p-sunset', 'Sunset'),
      summary('p-autumn', 'Autumn'),
      summary('p-meadow', 'Meadow'),
    ])

    expect(sorted.map(({ id }) => id)).toEqual([
      'p-autumn',
      'p-meadow',
      'p-sunset',
    ])
  })

  it('breaks ties on title using the Painting id', () => {
    const sorted = sortManagedPaintings([
      summary('zebra', 'Same'),
      summary('alpha', 'Same'),
    ])

    expect(sorted.map(({ id }) => id)).toEqual(['alpha', 'zebra'])
  })
})

describe('orderPaintingImages', () => {
  it('orders images by managed order, then createdAt, then id', () => {
    const ordered = orderPaintingImages([
      { id: 'c', altText: null, order: 1, createdAt: new Date('2024-01-03') },
      { id: 'a', altText: 'first', order: 0, createdAt: new Date('2024-01-01') },
      { id: 'b', altText: null, order: 1, createdAt: new Date('2024-01-02') },
    ])

    expect(ordered.map(({ id }) => id)).toEqual(['a', 'b', 'c'])
  })
})

describe('listPaintingsForManagement', () => {
  it('returns the repository Paintings sorted for the index', async () => {
    const repo = fakeRepository([
      record('p-sunset', 'Sunset'),
      record('p-autumn', 'Autumn'),
    ])

    const paintings = await listPaintingsForManagement(repo)

    expect(paintings.map(({ title }) => title)).toEqual(['Autumn', 'Sunset'])
  })
})

describe('loadManagedPainting', () => {
  it('returns managed fields with deterministically ordered images', async () => {
    const repo = fakeRepository([
      {
        ...record('p-sunset', 'Sunset'),
        price: '1200',
        measures: '30x40cm',
        content: 'A warm evening.',
        categoryName: 'Landscapes',
        images: [
          { id: 'i2', altText: null, order: 1, createdAt: new Date('2024-01-02') },
          {
            id: 'i1',
            altText: 'front',
            order: 0,
            createdAt: new Date('2024-01-01'),
          },
        ],
      },
    ])

    const detail = await loadManagedPainting(repo, 'p-sunset')

    expect(detail).not.toBeNull()
    expect(detail?.title).toBe('Sunset')
    expect(detail?.price).toBe('1200')
    expect(detail?.measures).toBe('30x40cm')
    expect(detail?.categoryName).toBe('Landscapes')
    expect(detail?.images.map(({ id }) => id)).toEqual(['i1', 'i2'])
  })

  it('returns null when the Painting does not exist', async () => {
    const repo = fakeRepository([])

    expect(await loadManagedPainting(repo, 'missing')).toBeNull()
  })
})

describe('deleteManagedPainting', () => {
  it('deletes the Painting and reports how many images were removed', async () => {
    const repo = fakeRepository([
      {
        ...record('p-sunset', 'Sunset'),
        images: [
          { id: 'i1', altText: null, order: 0, createdAt: new Date('2024-01-01') },
          { id: 'i2', altText: null, order: 1, createdAt: new Date('2024-01-02') },
        ],
      },
    ])

    const result = await deleteManagedPainting(repo, 'p-sunset')

    expect(result).toEqual({
      id: 'p-sunset',
      title: 'Sunset',
      deletedImages: 2,
    })
    expect(repo.state).toHaveLength(0)
  })

  it('returns null when the Painting does not exist', async () => {
    const repo = fakeRepository([])

    expect(await deleteManagedPainting(repo, 'missing')).toBeNull()
  })
})

function summary(id: string, title: string): ManagedPaintingSummary {
  return { id, title, imageCount: 0 }
}

function record(id: string, title: string): ManagedPaintingRecord {
  return {
    id,
    title,
    price: '0',
    measures: null,
    content: '',
    categoryName: null,
    images: [],
  }
}

type FakeRepository = ManagedPaintingRepository & {
  state: Array<ManagedPaintingRecord>
}

function fakeRepository(initial: Array<ManagedPaintingRecord>): FakeRepository {
  const state = initial.map((entry) => ({ ...entry }))

  return {
    state,
    async listPaintings() {
      return state.map((entry) => ({
        id: entry.id,
        title: entry.title,
        imageCount: entry.images.length,
      }))
    },
    async findPainting(id) {
      const found = state.find((entry) => entry.id === id)
      return found ? { ...found } : null
    },
    async deletePainting(id) {
      const index = state.findIndex((entry) => entry.id === id)
      if (index === -1) return null
      const [removed] = state.splice(index, 1)
      return {
        id: removed.id,
        title: removed.title,
        deletedImages: removed.images.length,
      }
    },
  }
}
