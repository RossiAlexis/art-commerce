import { createServerFn } from '@tanstack/react-start'

import { getPrisma } from '#/server/db'

import { loadGallery, parseGallerySearch } from './gallery'
import type { GalleryRepository } from './gallery'

const prismaGalleryRepository: GalleryRepository = {
  async listCategories() {
    const categories = await getPrisma().category.findMany({
      where: { subMenuTitle: { not: null } },
      select: { id: true, subMenuTitle: true },
    })

    return categories.flatMap((category) =>
      category.subMenuTitle
        ? [{ id: category.id, label: category.subMenuTitle }]
        : [],
    )
  },

  listPaintings(categoryId) {
    return getPrisma().painting.findMany({
      where: {
        images: { some: {} },
        ...(categoryId ? { categoryId } : {}),
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        images: {
          select: {
            id: true,
            altText: true,
          },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
  },
}

export const getGallery = createServerFn({ method: 'GET' })
  .validator((search: unknown) => parseGallerySearch(search))
  .handler(({ data }) => loadGallery(prismaGalleryRepository, data))
