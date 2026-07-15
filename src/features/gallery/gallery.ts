import { z } from 'zod'

export type GalleryImage = {
  id: string
  altText: string | null
}

export type GalleryPainting = {
  id: string
  title: string
  createdAt: Date
  images: Array<GalleryImage>
}

export type GalleryCategory = {
  id: string
  label: string
}

export type GalleryRepository = {
  listCategories: () => Promise<Array<GalleryCategory>>
  listPaintings: (categoryId: string | null) => Promise<Array<GalleryPainting>>
}

export const gallerySearchSchema = z.object({
  q: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => {
      const trimmed = value?.trim()
      return trimmed ? trimmed : undefined
    }),
})

export type GallerySearch = z.infer<typeof gallerySearchSchema>

export function parseGallerySearch(input: unknown): GallerySearch {
  return gallerySearchSchema.parse(input)
}

export type GalleryData = {
  categories: Array<GalleryCategory>
  paintings: Array<GalleryPainting>
  activeCategoryId: string | null
  categoryUnavailable: boolean
}

export async function loadGallery(
  repository: GalleryRepository,
  search: GallerySearch,
): Promise<GalleryData> {
  const requestedCategoryId = search.q ?? null

  const categories = (await repository.listCategories())
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label))

  const activeCategory = requestedCategoryId
    ? (categories.find(({ id }) => id === requestedCategoryId) ?? null)
    : null

  const categoryUnavailable =
    requestedCategoryId !== null && activeCategory === null

  const paintings = categoryUnavailable
    ? []
    : toVisibleOrdered(await repository.listPaintings(requestedCategoryId))

  return {
    categories,
    paintings,
    activeCategoryId: requestedCategoryId,
    categoryUnavailable,
  }
}

function toVisibleOrdered(
  paintings: Array<GalleryPainting>,
): Array<GalleryPainting> {
  return paintings
    .filter(({ images }) => images.length > 0)
    .sort((left, right) => {
      const createdAtDifference =
        left.createdAt.getTime() - right.createdAt.getTime()

      return createdAtDifference || left.id.localeCompare(right.id)
    })
}
