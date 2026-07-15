import { describe, expect, it } from 'vitest'

import { createImageResponse, serveStoredImage } from './image-response'

describe('createImageResponse', () => {
  it('serves immutable inline image bytes with their content type', async () => {
    const response = createImageResponse({
      id: 'image-1',
      contentType: 'image/png',
      bytes: new Uint8Array([137, 80, 78, 71]),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('content-length')).toBe('4')
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(response.headers.get('content-disposition')).toBe(
      'inline; filename="image-1"',
    )
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([137, 80, 78, 71]),
    )
  })

  it('refuses database content that is not a supported raster image', () => {
    const response = createImageResponse({
      id: 'unsafe-image',
      contentType: 'text/html',
      bytes: new TextEncoder().encode('<script>alert(1)</script>'),
    })

    expect(response.status).toBe(415)
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=UTF-8',
    )
  })
})

describe('serveStoredImage', () => {
  it('serves the stored bytes with their content type when the image exists', async () => {
    const response = await serveStoredImage(async () => ({
      id: 'image-1',
      contentType: 'image/png',
      blob: new Uint8Array([137, 80, 78, 71]),
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([137, 80, 78, 71]),
    )
  })

  it('responds with 404 when the image is missing', async () => {
    const response = await serveStoredImage(async () => null)

    expect(response.status).toBe(404)
  })
})
