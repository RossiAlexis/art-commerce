import { describe, expect, it } from 'vitest'

import { loadHomepage } from './homepage'

describe('loadHomepage', () => {
  it('returns the first four visible Paintings in creation order', async () => {
    const result = await loadHomepage({
      getHomepage: async () => ({
        title: '¡Hola!',
        text: 'Welcome to my portfolio.',
        image: null,
      }),
      listPaintings: async () => [
        painting('fifth', '2024-01-05', ['image-5']),
        painting('hidden', '2024-01-01', []),
        painting('second', '2024-01-02', ['image-2']),
        painting('fourth', '2024-01-04', ['image-4']),
        painting('first', '2024-01-01', ['image-1']),
        painting('third', '2024-01-03', ['image-3']),
      ],
    })

    expect(result.homepage).toEqual({
      title: '¡Hola!',
      text: 'Welcome to my portfolio.',
      image: null,
    })
    expect(result.paintings.map(({ id }) => id)).toEqual([
      'first',
      'second',
      'third',
      'fourth',
    ])
  })

  it('uses the Painting id to break equal creation-time ties', async () => {
    const result = await loadHomepage({
      getHomepage: async () => null,
      listPaintings: async () => [
        painting('zebra', '2024-01-01', ['image-z']),
        painting('alpha', '2024-01-01', ['image-a']),
      ],
    })

    expect(result.paintings.map(({ id }) => id)).toEqual(['alpha', 'zebra'])
  })
})

function painting(id: string, createdAt: string, imageIds: Array<string>) {
  return {
    id,
    title: id,
    createdAt: new Date(`${createdAt}T00:00:00.000Z`),
    images: imageIds.map((imageId) => ({ id: imageId, altText: null })),
  }
}
