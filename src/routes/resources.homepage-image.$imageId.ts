import { createFileRoute } from '@tanstack/react-router'

import { serveStoredImage } from '#/features/images/image-response'
import { getPrisma } from '#/server/db'

export const Route = createFileRoute('/resources/homepage-image/$imageId')({
  server: {
    handlers: {
      GET: ({ params }) =>
        serveStoredImage(() =>
          getPrisma().homepageImage.findUnique({
            where: { id: params.imageId },
            select: { id: true, contentType: true, blob: true },
          }),
        ),
    },
  },
})
