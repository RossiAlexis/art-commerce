import { z } from 'zod'

export type PaintingDetailImage = {
  id: string
  altText: string | null
  order: number
  createdAt: Date
}

export type PaintingDetailRecord = {
  id: string
  title: string
  price: string
  measures: string | null
  content: string
  images: Array<PaintingDetailImage>
}

export type PaintingDetailRepository = {
  findPainting: (id: string) => Promise<PaintingDetailRecord | null>
}

export type PaintingDetailImageView = {
  id: string
  altText: string | null
}

export type PaintingDetailData = {
  id: string
  title: string
  priceText: string
  measures: string | null
  description: string
  images: Array<PaintingDetailImageView>
}

export const paintingIdSchema = z.string().trim().min(1)

export function parsePaintingId(input: unknown): string {
  return paintingIdSchema.parse(input)
}

export function formatCadPrice(price: string): string {
  const trimmed = price.trim()
  const withSymbol = /^\d/.test(trimmed) ? `$${trimmed}` : trimmed
  return `${withSymbol} CAD`
}

export async function loadPaintingDetail(
  repository: PaintingDetailRepository,
  id: string,
): Promise<PaintingDetailData | null> {
  const painting = await repository.findPainting(id)

  if (!painting) return null

  const images = painting.images
    .slice()
    .sort((left, right) => {
      return (
        left.order - right.order ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id)
      )
    })
    .map(({ id: imageId, altText }) => ({ id: imageId, altText }))

  return {
    id: painting.id,
    title: painting.title,
    priceText: formatCadPrice(painting.price),
    measures: painting.measures,
    description: painting.content,
    images,
  }
}
