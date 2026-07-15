import { getPrisma } from '#/server/db'
import { getServerEnv } from '#/server/env'

import { buildRobotsTxt, buildSitemapXml } from './seo'

export type SeoRepository = {
  /** Ids of Paintings that are publicly visible (have at least one image). */
  listPublicPaintingIds: () => Promise<Array<string>>
}

const prismaSeoRepository: SeoRepository = {
  async listPublicPaintingIds() {
    // Same public-visibility rule as the gallery and Painting detail: a
    // Painting is public only once it has an image. Ordering matches the
    // gallery so the sitemap is deterministic across requests.
    const paintings = await getPrisma().painting.findMany({
      where: { images: { some: {} } },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })

    return paintings.map((painting) => painting.id)
  },
}

/** Origin (scheme + host) the request arrived on, used for absolute URLs. */
function originFrom(request: Request): string {
  return new URL(request.url).origin
}

export async function sitemapResponse(
  request: Request,
  repository: SeoRepository = prismaSeoRepository,
): Promise<Response> {
  const paintingIds = await repository.listPublicPaintingIds()
  const xml = buildSitemapXml(originFrom(request), paintingIds)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export function robotsResponse(request: Request): Response {
  const allowIndexing = getServerEnv().ALLOW_INDEXING === 'true'
  const body = buildRobotsTxt(originFrom(request), allowIndexing)

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
