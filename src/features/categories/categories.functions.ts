import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'

import { getPrisma } from '#/server/db'

import {
  createManagedCategory,
  deleteManagedCategory,
  listCategoriesForManagement,
  updateManagedCategory,
} from './categories'
import type { CategoryRepository, ManagedCategory } from './categories'

const categorySelect = {
  id: true,
  description: true,
  subMenuTitle: true,
  _count: { select: { paintings: true } },
} as const

type CategoryRow = {
  id: string
  description: string
  subMenuTitle: string | null
  _count: { paintings: number }
}

function toManagedCategory(row: CategoryRow): ManagedCategory {
  return {
    id: row.id,
    name: row.description,
    navigationLabel: row.subMenuTitle,
    paintingCount: row._count.paintings,
  }
}

const prismaCategoryRepository: CategoryRepository = {
  async listCategories() {
    const rows = await getPrisma().category.findMany({ select: categorySelect })
    return rows.map(toManagedCategory)
  },

  async findCategory(id) {
    const row = await getPrisma().category.findUnique({
      where: { id },
      select: categorySelect,
    })
    return row ? toManagedCategory(row) : null
  },

  async createCategory(input) {
    const row = await getPrisma().category.create({
      data: { description: input.name, subMenuTitle: input.navigationLabel },
      select: categorySelect,
    })
    return toManagedCategory(row)
  },

  async updateCategory(id, input) {
    const prisma = getPrisma()
    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) return null

    const row = await prisma.category.update({
      where: { id },
      data: { description: input.name, subMenuTitle: input.navigationLabel },
      select: categorySelect,
    })
    return toManagedCategory(row)
  },

  async deleteCategory(id) {
    return getPrisma().$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { id },
        select: { id: true, description: true },
      })
      if (!existing) return null

      // Preserve the Paintings but detach them so deleting navigation never
      // destroys portfolio work (PRD US 43).
      const { count } = await tx.painting.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })
      await tx.category.delete({ where: { id } })

      return {
        id: existing.id,
        name: existing.description,
        uncategorizedPaintings: count,
      }
    })
  },
}

// The centralized Administration guard lives in the server-only session module,
// which statically imports the denied `@tanstack/react-start/server` specifier;
// it is reached exclusively through this dynamic import so it never enters the
// client bundle.
async function guard(username: string) {
  const { requireAdministrator } = await import('#/features/auth/auth.session')
  return requireAdministrator({
    returnTo: `/administration/${username}/categories`,
    requestedUsername: username,
  })
}

const usernameInput = z.object({ username: z.string().min(1) })
const categoryIdInput = usernameInput.extend({
  categoryId: z.string().min(1),
})
const mutationFields = {
  name: z.string(),
  navigationLabel: z.string(),
}

export const listCategoriesFn = createServerFn({ method: 'GET' })
  .validator(usernameInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    return {
      username: data.username,
      categories: await listCategoriesForManagement(prismaCategoryRepository),
    }
  })

export const getCategoryFn = createServerFn({ method: 'GET' })
  .validator(categoryIdInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    const category = await prismaCategoryRepository.findCategory(
      data.categoryId,
    )
    if (!category) throw notFound()
    return { username: data.username, category }
  })

export const createCategoryFn = createServerFn({ method: 'POST' })
  .validator(usernameInput.extend(mutationFields))
  .handler(async ({ data }) => {
    await guard(data.username)
    return createManagedCategory(prismaCategoryRepository, {
      name: data.name,
      navigationLabel: data.navigationLabel,
    })
  })

export const updateCategoryFn = createServerFn({ method: 'POST' })
  .validator(categoryIdInput.extend(mutationFields))
  .handler(async ({ data }) => {
    await guard(data.username)
    const result = await updateManagedCategory(
      prismaCategoryRepository,
      data.categoryId,
      { name: data.name, navigationLabel: data.navigationLabel },
    )
    if (result === null) throw notFound()
    return result
  })

export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .validator(categoryIdInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    const deletion = await deleteManagedCategory(
      prismaCategoryRepository,
      data.categoryId,
    )
    if (deletion === null) throw notFound()
    return deletion
  })
