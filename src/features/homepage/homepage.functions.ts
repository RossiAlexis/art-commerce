import { createServerFn } from '@tanstack/react-start'

import { getPrisma } from '#/server/db'

import { loadHomepage } from './homepage'
import type { HomepageRepository } from './homepage'

const prismaHomepageRepository: HomepageRepository = {
  async getHomepage() {
    const homepage = await getPrisma().homePage.findFirst({
      select: {
        title: true,
        text: true,
        image: {
          select: {
            id: true,
            altText: true,
          },
          take: 1,
        },
      },
    })

    if (!homepage) return null

    return {
      title: homepage.title,
      text: homepage.text,
      image: homepage.image[0] ?? null,
    }
  },

  listPaintings() {
    return getPrisma().painting.findMany({
      where: {
        images: { some: {} },
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
      take: 4,
    })
  },
}

export const getHomepage = createServerFn({ method: 'GET' }).handler(() =>
  loadHomepage(prismaHomepageRepository),
)
