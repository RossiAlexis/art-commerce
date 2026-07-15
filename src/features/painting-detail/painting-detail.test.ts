import { describe, expect, it } from 'vitest'

import { formatCadPrice, loadPaintingDetail } from './painting-detail'
import type { PaintingDetailRecord } from './painting-detail'

describe('formatCadPrice', () => {
  it('presents a numeric price as Canadian dollars', () => {
    expect(formatCadPrice('100')).toBe('$100 CAD')
    expect(formatCadPrice('  250 ')).toBe('$250 CAD')
  })

  it('does not add a currency symbol to non-numeric price text', () => {
    expect(formatCadPrice('Sold')).toBe('Sold CAD')
  })
})

describe('loadPaintingDetail', () => {
  it('returns null for a Painting that is not publicly available', async () => {
    const result = await loadPaintingDetail(
      { findPainting: async () => null },
      'missing',
    )

    expect(result).toBeNull()
  })

  it('orders images by managed order with a deterministic tie-breaker', async () => {
    const result = await loadPaintingDetail(
      {
        findPainting: async () =>
          record('painting-1', [
            image('c', 1, '2024-01-01'),
            image('a', 0, '2024-01-03'),
            image('zebra', 0, '2024-01-02'),
            image('alpha', 0, '2024-01-02'),
          ]),
      },
      'painting-1',
    )

    expect(result?.images.map(({ id }) => id)).toEqual([
      'alpha',
      'zebra',
      'a',
      'c',
    ])
  })

  it('exposes the presentable Painting fields', async () => {
    const result = await loadPaintingDetail(
      {
        findPainting: async () => ({
          id: 'painting-1',
          title: 'Blooming',
          price: '100',
          measures: '20 × 20 cm',
          content: 'A field of tulips.',
          images: [image('image-1', 0, '2024-01-01')],
        }),
      },
      'painting-1',
    )

    expect(result).toEqual({
      id: 'painting-1',
      title: 'Blooming',
      priceText: '$100 CAD',
      measures: '20 × 20 cm',
      description: 'A field of tulips.',
      images: [{ id: 'image-1', altText: null }],
    })
  })
})

function record(
  id: string,
  images: PaintingDetailRecord['images'],
): PaintingDetailRecord {
  return {
    id,
    title: id,
    price: '100',
    measures: '20 × 20 cm',
    content: `Description of ${id}.`,
    images,
  }
}

function image(
  id: string,
  order: number,
  createdAt: string,
): PaintingDetailRecord['images'][number] {
  return {
    id,
    altText: null,
    order,
    createdAt: new Date(`${createdAt}T00:00:00.000Z`),
  }
}
