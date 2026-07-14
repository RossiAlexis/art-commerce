type ImagePayload = {
  id: string
  contentType: string
  bytes: Uint8Array
}

type StoredImage = {
  id: string
  contentType: string
  blob: Uint8Array
}

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function createImageResponse({ id, contentType, bytes }: ImagePayload) {
  if (!allowedImageTypes.has(contentType)) {
    return new Response('Unsupported image type', { status: 415 })
  }

  const body = Uint8Array.from(bytes).buffer

  return new Response(new Blob([body], { type: contentType }), {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${encodeURIComponent(id)}"`,
      'Content-Length': String(bytes.byteLength),
      'Content-Type': contentType,
    },
  })
}

export async function serveStoredImage(
  loadImage: () => Promise<StoredImage | null>,
) {
  const image = await loadImage()

  if (!image) {
    return new Response('Not found', { status: 404 })
  }

  return createImageResponse({
    id: image.id,
    contentType: image.contentType,
    bytes: image.blob,
  })
}
