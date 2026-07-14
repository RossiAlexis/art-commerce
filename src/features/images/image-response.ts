type ImagePayload = {
  id: string
  contentType: string
  bytes: Uint8Array
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
