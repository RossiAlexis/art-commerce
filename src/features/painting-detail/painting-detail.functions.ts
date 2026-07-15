import { createServerFn } from '@tanstack/react-start'

import { getPrisma } from '#/server/db'

import { loadPaintingDetail, parsePaintingId } from './painting-detail'
import type { PaintingDetailRepository } from './painting-detail'

const prismaPaintingDetailRepository: PaintingDetailRepository = {
  findPainting(id) {
    return getPrisma().painting.findFirst({
      // Public Paintings require at least one image; image-less records stay
      // administrable but are not publicly visible, so they resolve to a 404.
      where: { id, images: { some: {} } },
      select: {
        id: true,
        title: true,
        price: true,
        measures: true,
        content: true,
        images: {
          select: {
            id: true,
            altText: true,
            order: true,
            createdAt: true,
          },
        },
      },
    })
  },
}

export const getPaintingDetail = createServerFn({ method: 'GET' })
  .validator((id: unknown) => parsePaintingId(id))
  .handler(({ data }) =>
    loadPaintingDetail(prismaPaintingDetailRepository, data),
  )
