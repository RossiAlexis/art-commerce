/**
 * Domain logic for the protected Painting management read-and-delete journey.
 * It is framework-independent and orchestrated over a repository interface so
 * the list, inspect, and delete behavior can be unit-tested with an in-memory
 * fake. Server wiring (Prisma, the Administrator guard) lives in
 * `paintings-admin.functions.ts`.
 */

export type ManagedPaintingImage = {
  id: string
  altText: string | null
  order: number
  createdAt: Date
}

/** A Painting row as shown in the alphabetical Administration index. */
export type ManagedPaintingSummary = {
  id: string
  title: string
  imageCount: number
}

/** A Painting and its images as stored, before ordering for presentation. */
export type ManagedPaintingRecord = {
  id: string
  title: string
  price: string
  measures: string | null
  content: string
  categoryName: string | null
  images: Array<ManagedPaintingImage>
}

export type ManagedPaintingImageView = {
  id: string
  altText: string | null
  order: number
}

/** The inspect view's data: managed fields plus deterministically ordered images. */
export type ManagedPaintingDetail = {
  id: string
  title: string
  price: string
  measures: string | null
  content: string
  categoryName: string | null
  images: Array<ManagedPaintingImageView>
}

/** Outcome of deleting a Painting, used to report the image cascade (US 40). */
export type PaintingDeletion = {
  id: string
  title: string
  deletedImages: number
}

export type ManagedPaintingRepository = {
  listPaintings: () => Promise<Array<ManagedPaintingSummary>>
  findPainting: (id: string) => Promise<ManagedPaintingRecord | null>
  deletePainting: (id: string) => Promise<PaintingDeletion | null>
}

/** Order Paintings alphabetically by title for the index view. */
export function sortManagedPaintings(
  paintings: Array<ManagedPaintingSummary>,
): Array<ManagedPaintingSummary> {
  return paintings
    .slice()
    .sort(
      (left, right) =>
        left.title.localeCompare(right.title) ||
        left.id.localeCompare(right.id),
    )
}

/**
 * Order a Painting's images by the managed `order`, breaking ties on
 * `createdAt` then `id` so presentation stays deterministic — matching the
 * public detail contract.
 */
export function orderPaintingImages(
  images: Array<ManagedPaintingImage>,
): Array<ManagedPaintingImageView> {
  return images
    .slice()
    .sort(
      (left, right) =>
        left.order - right.order ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    )
    .map(({ id, altText, order }) => ({ id, altText, order }))
}

export async function listPaintingsForManagement(
  repository: ManagedPaintingRepository,
): Promise<Array<ManagedPaintingSummary>> {
  return sortManagedPaintings(await repository.listPaintings())
}

/** Load a Painting for inspection, or resolve to `null` when it does not exist. */
export async function loadManagedPainting(
  repository: ManagedPaintingRepository,
  id: string,
): Promise<ManagedPaintingDetail | null> {
  const painting = await repository.findPainting(id)
  if (!painting) return null

  return {
    id: painting.id,
    title: painting.title,
    price: painting.price,
    measures: painting.measures,
    content: painting.content,
    categoryName: painting.categoryName,
    images: orderPaintingImages(painting.images),
  }
}

export async function deleteManagedPainting(
  repository: ManagedPaintingRepository,
  id: string,
): Promise<PaintingDeletion | null> {
  return repository.deletePainting(id)
}
