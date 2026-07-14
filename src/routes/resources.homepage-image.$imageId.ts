import { createFileRoute } from '@tanstack/react-router'

import { createImageResponse } from '#/features/images/image-response'
import { getPrisma } from '#/server/db'

export const Route = createFileRoute('/resources/homepage-image/$imageId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const image = await getPrisma().homepageImage.findUnique({
          where: { id: params.imageId },
          select: { id: true, contentType: true, blob: true },
        })

        if (!image) {
          return new Response('Not found', { status: 404 })
        }

        return createImageResponse({
          id: image.id,
          contentType: image.contentType,
          bytes: image.blob,
        })
      },
    },
  },
})
