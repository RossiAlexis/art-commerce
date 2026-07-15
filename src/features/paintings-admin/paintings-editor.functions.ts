import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'

import { getPrisma } from '#/server/db'

import { orderPaintingImages } from './paintings-admin'
import {
  addManagedPaintingImage,
  createManagedPainting,
  describeManagedPaintingImage,
  paintingFieldsSchema,
  removeManagedPaintingImage,
  reorderManagedPaintingImages,
  replaceManagedPaintingImage,
  updateManagedPaintingFields,
} from './paintings-editor'
import type {
  CategoryOption,
  EditablePainting,
  PaintingEditorRepository,
} from './paintings-editor'

// The centralized Administration guard lives in the server-only session module,
// which statically imports the denied `@tanstack/react-start/server` specifier;
// it is reached exclusively through this dynamic import so that specifier never
// enters the client bundle.
async function guard(username: string) {
  const { requireAdministrator } = await import('#/features/auth/auth.session')
  return requireAdministrator({
    returnTo: `/administration/${username}/paintings`,
    requestedUsername: username,
  })
}

/** Build the editor repository bound to the owning Administrator. */
function editorRepository(ownerId: string): PaintingEditorRepository {
  return {
    async createPainting(fields) {
      const created = await getPrisma().painting.create({
        data: {
          title: fields.title,
          price: fields.price,
          measures: fields.measures,
          content: fields.content,
          categoryId: fields.categoryId,
          ownerId,
        },
        select: { id: true },
      })
      return { id: created.id }
    },

    async updatePainting(id, fields) {
      const existing = await getPrisma().painting.findUnique({
        where: { id },
        select: { id: true },
      })
      if (!existing) return false
      await getPrisma().painting.update({
        where: { id },
        data: {
          title: fields.title,
          price: fields.price,
          measures: fields.measures,
          content: fields.content,
          categoryId: fields.categoryId,
        },
      })
      return true
    },

    async addImage({ paintingId, image }) {
      const painting = await getPrisma().painting.findUnique({
        where: { id: paintingId },
        select: { id: true },
      })
      if (!painting) return null
      const last = await getPrisma().paintingImage.findFirst({
        where: { paintingId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      const created = await getPrisma().paintingImage.create({
        data: {
          paintingId,
          order: (last?.order ?? -1) + 1,
          altText: image.altText,
          contentType: image.contentType,
          blob: Buffer.from(image.bytes),
        },
        select: { id: true },
      })
      return { id: created.id }
    },

    // Replacement writes a fresh row (new cuid → new immutable-cache URL) and
    // deletes the old one in the same transaction, so no orphan blob remains.
    async replaceImage({ imageId, image }) {
      return getPrisma().$transaction(async (tx) => {
        const existing = await tx.paintingImage.findUnique({
          where: { id: imageId },
          select: { paintingId: true, order: true, altText: true },
        })
        if (!existing) return null
        await tx.paintingImage.delete({ where: { id: imageId } })
        const created = await tx.paintingImage.create({
          data: {
            paintingId: existing.paintingId,
            order: existing.order,
            altText: image.altText ?? existing.altText,
            contentType: image.contentType,
            blob: Buffer.from(image.bytes),
          },
          select: { id: true },
        })
        return { id: created.id }
      })
    },

    async describeImage({ imageId, altText }) {
      const result = await getPrisma().paintingImage.updateMany({
        where: { id: imageId },
        data: { altText },
      })
      return result.count > 0
    },

    async reorderImages({ paintingId, orderedImageIds }) {
      const images = await getPrisma().paintingImage.findMany({
        where: { paintingId },
        select: { id: true },
      })
      const owned = new Set(images.map((image) => image.id))
      if (
        orderedImageIds.length !== images.length ||
        !orderedImageIds.every((id) => owned.has(id))
      ) {
        return false
      }
      await getPrisma().$transaction(
        orderedImageIds.map((id, order) =>
          getPrisma().paintingImage.update({ where: { id }, data: { order } }),
        ),
      )
      return true
    },

    async removeImage(imageId) {
      const result = await getPrisma().paintingImage.deleteMany({
        where: { id: imageId },
      })
      return result.count > 0
    },
  }
}

async function loadCategoryOptions(): Promise<Array<CategoryOption>> {
  const rows = await getPrisma().category.findMany({
    select: { id: true, description: true },
  })
  return rows
    .map((row) => ({ id: row.id, name: row.description }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function loadEditablePainting(
  paintingId: string,
): Promise<EditablePainting | null> {
  const row = await getPrisma().painting.findUnique({
    where: { id: paintingId },
    select: {
      id: true,
      title: true,
      price: true,
      measures: true,
      content: true,
      categoryId: true,
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
    measures: row.measures ?? '',
    categoryId: row.categoryId,
    content: row.content,
    images: orderPaintingImages(row.images),
  }
}

const usernameInput = z.object({ username: z.string().min(1) })
const paintingIdInput = usernameInput.extend({ paintingId: z.string().min(1) })
const imageIdInput = usernameInput.extend({ imageId: z.string().min(1) })
const fieldsInput = usernameInput.merge(paintingFieldsSchema)

function formGuardFields(data: FormData) {
  return String(data.get('username') ?? '')
}

/** Guarded context for the create form: Category options only. */
export const newPaintingContextFn = createServerFn({ method: 'GET' })
  .validator(usernameInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    return { username: data.username, categories: await loadCategoryOptions() }
  })

/** Guarded context for the edit form: the Painting plus Category options. */
export const getPaintingForEditFn = createServerFn({ method: 'GET' })
  .validator(paintingIdInput)
  .handler(async ({ data }) => {
    await guard(data.username)
    const painting = await loadEditablePainting(data.paintingId)
    if (!painting) throw notFound()
    return {
      username: data.username,
      painting,
      categories: await loadCategoryOptions(),
    }
  })

/** Guarded create of a Painting's managed fields. */
export const createPaintingFn = createServerFn({ method: 'POST' })
  .validator(fieldsInput)
  .handler(async ({ data }) => {
    const user = await guard(data.username)
    const { username: _username, ...fields } = data
    return createManagedPainting(editorRepository(user.id), fields)
  })

/** Guarded update of a Painting's managed fields. */
export const updatePaintingFn = createServerFn({ method: 'POST' })
  .validator(paintingIdInput.merge(paintingFieldsSchema))
  .handler(async ({ data }) => {
    const user = await guard(data.username)
    const { username: _username, paintingId, ...fields } = data
    const result = await updateManagedPaintingFields(
      editorRepository(user.id),
      paintingId,
      fields,
    )
    if (result === null) throw notFound()
    return result
  })

async function readImagePayload(data: FormData) {
  const file = data.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return null
  }
  const rawAltText = data.get('altText')
  return {
    contentType: file.type,
    altText: typeof rawAltText === 'string' ? rawAltText : null,
    bytes: new Uint8Array(await file.arrayBuffer()),
  }
}

/** Guarded add of a single image (one file per request). */
export const addPaintingImageFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected multipart form data for the image upload.')
    }
    return data
  })
  .handler(async ({ data }) => {
    const user = await guard(formGuardFields(data))
    const paintingId = String(data.get('paintingId') ?? '')
    const payload = await readImagePayload(data)
    if (!payload) {
      return { ok: false as const, error: 'Choose an image file to upload.' }
    }
    return addManagedPaintingImage(editorRepository(user.id), {
      paintingId,
      image: payload,
    })
  })

/** Guarded replace of an existing image (one file per request). */
export const replacePaintingImageFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected multipart form data for the image upload.')
    }
    return data
  })
  .handler(async ({ data }) => {
    const user = await guard(formGuardFields(data))
    const imageId = String(data.get('imageId') ?? '')
    const payload = await readImagePayload(data)
    if (!payload) {
      return { ok: false as const, error: 'Choose an image file to upload.' }
    }
    return replaceManagedPaintingImage(editorRepository(user.id), {
      imageId,
      image: payload,
    })
  })

/** Guarded update of an image's alt text. */
export const describePaintingImageFn = createServerFn({ method: 'POST' })
  .validator(imageIdInput.extend({ altText: z.string() }))
  .handler(async ({ data }) => {
    const user = await guard(data.username)
    return describeManagedPaintingImage(editorRepository(user.id), {
      imageId: data.imageId,
      altText: data.altText,
    })
  })

/** Guarded reorder of a Painting's images. */
export const reorderPaintingImagesFn = createServerFn({ method: 'POST' })
  .validator(
    paintingIdInput.extend({ orderedImageIds: z.array(z.string().min(1)) }),
  )
  .handler(async ({ data }) => {
    const user = await guard(data.username)
    return reorderManagedPaintingImages(editorRepository(user.id), {
      paintingId: data.paintingId,
      orderedImageIds: data.orderedImageIds,
    })
  })

/** Guarded removal of a single image. */
export const removePaintingImageFn = createServerFn({ method: 'POST' })
  .validator(imageIdInput)
  .handler(async ({ data }) => {
    const user = await guard(data.username)
    return removeManagedPaintingImage(editorRepository(user.id), data.imageId)
  })
