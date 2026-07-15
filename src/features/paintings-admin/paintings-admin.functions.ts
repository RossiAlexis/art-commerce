import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'

import { getPrisma } from '#/server/db'

import {
  deleteManagedPainting,
  listPaintingsForManagement,
  loadManagedPainting,
} from './paintings-admin'
import type { ManagedPaintingRepository } from './paintings-admin'

const prismaPaintingRepository: ManagedPaintingRepository = {
  async listPaintings() {
    const rows = await getPrisma().painting.findMany({
      select: {
        id: true,
        title: true,
        _count: { select: { images: true } },
      },
    })
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      imageCount: row._count.images,
    }))
  },

  async findPainting(id) {
    const row = await getPrisma().painting.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        price: true,
        measures: true,
        content: true,
        Category: { select: { description: true } },
        images: {
          select: { id: true, altText: true, order: true, createdAt: true },
        },
      },
    })
    if (!row) return null
    return {
      id: row.id,
      title: row.title,
      price: row.price,
      measures: row.measures,
      content: row.content,
      categoryName: row.Category?.description ?? null,
      images: row.images,
    }
  },

  async deletePainting(id) {
    const prisma = getPrisma()
    const existing = await prisma.painting.findUnique({
      where: { id },
      select: { id: true, title: true, _count: { select: { images: true } } },
    })
    if (!existing) return null

    // Removing the Painting cascades its PaintingImage rows via the schema's
    // onDelete: Cascade, so no orphaned image blobs remain (PRD US 40).
    await prisma.painting.delete({ where: { id } })

    return {
      id: existing.id,
      title: existing.title,
      deletedImages: existing._count.images,
    }
  },
}

// The centralized Administration guard lives in the server-only session module,
// which statically imports the denied `@tanstack/react-start/server` specifier;
// it is reached exclusively through this dynamic import so it never enters the
// client bundle.
async function guard(username: string) {
  const { requireAdministrator } = await import('#/features/auth/auth.session')
  return requireAdministrator({
    returnTo: `/administration/${username}/paintings`,
    requestedUsername: username,
  })
}

const usernameInput = z.object({ username: z.string().min(1) })
const paintingIdInput = usernameInput.extend({
  paintingId: z.string().min(1),
})

export const listPaintingsFn = createServerFn({ method: 'GET' })
  .validator(usernameInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    return {
      username: data.username,
      paintings: await listPaintingsForManagement(prismaPaintingRepository),
    }
  })

export const getPaintingFn = createServerFn({ method: 'GET' })
  .validator(paintingIdInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    const painting = await loadManagedPainting(
      prismaPaintingRepository,
      data.paintingId,
    )
    if (!painting) throw notFound()
    return { username: data.username, painting }
  })

export const deletePaintingFn = createServerFn({ method: 'POST' })
  .validator(paintingIdInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    const deletion = await deleteManagedPainting(
      prismaPaintingRepository,
      data.paintingId,
    )
    if (deletion === null) throw notFound()
    return deletion
  })
