import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPrisma } from '#/server/db'

import {
  homepageContentSchema,
  loadAdminHomepage,
  removeHomepageImage,
  saveHomepageContent,
  saveHomepageImage,
  describeHomepageImage,
  normalizeAltText,
} from './homepage-admin'
import type {
  AdminHomepageRecord,
  HomepageAdminRepository,
} from './homepage-admin'

// The Administration guard lives in the server-only auth.session module (it
// statically imports `@tanstack/react-start/server`, which is denied to the
// client bundle). It is reached exclusively through the dynamic import below.
async function guard(input: { returnTo: string; requestedUsername: string }) {
  const { requireAdministrator } = await import('#/features/auth/auth.session')
  return requireAdministrator({
    returnTo: input.returnTo,
    requestedUsername: input.requestedUsername,
  })
}

const homepageImageSelect = {
  id: true,
  title: true,
  text: true,
  image: {
    select: { id: true, altText: true },
    take: 1,
  },
} as const

function toRecord(homepage: {
  id: string
  title: string
  text: string
  image: Array<{ id: string; altText: string | null }>
}): AdminHomepageRecord {
  return {
    id: homepage.id,
    title: homepage.title,
    text: homepage.text,
    image: homepage.image[0] ?? null,
  }
}

const prismaHomepageAdminRepository: HomepageAdminRepository = {
  async getSingleton() {
    const homepage = await getPrisma().homePage.findFirst({
      select: homepageImageSelect,
    })
    return homepage ? toRecord(homepage) : null
  },

  async updateContent({ id, title, text }) {
    const homepage = await getPrisma().homePage.update({
      where: { id },
      data: { title, text },
      select: homepageImageSelect,
    })
    return toRecord(homepage)
  },

  async putImage({ homepageId, image }) {
    const blob = Buffer.from(image.bytes)
    await getPrisma().homepageImage.upsert({
      where: { homepageId },
      update: {
        contentType: image.contentType,
        altText: image.altText,
        blob,
      },
      create: {
        homepageId,
        contentType: image.contentType,
        altText: image.altText,
        blob,
      },
    })
    return reloadSingleton(homepageId)
  },

  async updateImageAltText({ homepageId, altText }) {
    await getPrisma().homepageImage.update({
      where: { homepageId },
      data: { altText },
    })
    return reloadSingleton(homepageId)
  },

  async removeImage({ homepageId }) {
    await getPrisma().homepageImage.deleteMany({ where: { homepageId } })
    return reloadSingleton(homepageId)
  },
}

async function reloadSingleton(id: string): Promise<AdminHomepageRecord> {
  const homepage = await getPrisma().homePage.findUniqueOrThrow({
    where: { id },
    select: homepageImageSelect,
  })
  return toRecord(homepage)
}

/** Guarded read of the singleton Homepage for the Administration editor. */
export const getAdminHomepageFn = createServerFn({ method: 'GET' })
  .validator((input: { returnTo: string; requestedUsername: string }) => input)
  .handler(async ({ data }) => {
    await guard(data)
    return loadAdminHomepage(prismaHomepageAdminRepository)
  })

// Every guarded server fn carries the return target and requested username so
// requireAdministrator can enforce the ownership invariant. Shared here so the
// three JSON-bodied mutations validate the guard fields identically.
const guardInput = z.object({
  returnTo: z.string(),
  requestedUsername: z.string(),
})

const contentInput = homepageContentSchema.merge(guardInput)

/** Guarded update of the Homepage title and text (shared validation). */
export const saveHomepageContentFn = createServerFn({ method: 'POST' })
  .validator(contentInput)
  .handler(async ({ data }) => {
    await guard(data)
    return saveHomepageContent(prismaHomepageAdminRepository, {
      title: data.title,
      text: data.text,
    })
  })

/** Guarded add/replace of the optional Homepage image via multipart upload. */
export const saveHomepageImageFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected multipart form data for the Homepage image.')
    }
    return data
  })
  .handler(async ({ data }) => {
    await guard({
      returnTo: String(data.get('returnTo') ?? ''),
      requestedUsername: String(data.get('requestedUsername') ?? ''),
    })

    const file = data.get('image')
    if (!(file instanceof File)) {
      return { ok: false as const, error: 'Choose an image file to upload.' }
    }

    const rawAltText = data.get('altText')
    const altText = normalizeAltText(
      typeof rawAltText === 'string' ? rawAltText : null,
    )

    return saveHomepageImage(prismaHomepageAdminRepository, {
      image: {
        contentType: file.type,
        altText,
        bytes: new Uint8Array(await file.arrayBuffer()),
      },
    })
  })

const describeInput = guardInput.extend({ altText: z.string() })

/** Guarded update of the existing Homepage image alt text. */
export const describeHomepageImageFn = createServerFn({ method: 'POST' })
  .validator(describeInput)
  .handler(async ({ data }) => {
    await guard(data)
    return describeHomepageImage(prismaHomepageAdminRepository, {
      altText: data.altText,
    })
  })

/** Guarded removal of the optional Homepage image. */
export const removeHomepageImageFn = createServerFn({ method: 'POST' })
  .validator(guardInput)
  .handler(async ({ data }) => {
    await guard(data)
    return removeHomepageImage(prismaHomepageAdminRepository)
  })
