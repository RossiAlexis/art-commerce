import { describe, expect, it } from 'vitest'

import { sitemapResponse } from './seo.functions'
import type { SeoRepository } from './seo.functions'

const repositoryWith = (ids: Array<string>): SeoRepository => ({
  listPublicPaintingIds: async () => ids,
})

describe('sitemapResponse', () => {
  it('serves public painting URLs as XML derived from the request origin', async () => {
    const response = await sitemapResponse(
      new Request('https://veromiller.art/sitemap.xml'),
      repositoryWith(['abc', 'def']),
    )

    expect(response.headers.get('content-type')).toBe(
      'application/xml; charset=utf-8',
    )

    const body = await response.text()
    expect(body).toContain('<loc>https://veromiller.art/</loc>')
    expect(body).toContain('<loc>https://veromiller.art/paintings/abc</loc>')
    expect(body).toContain('<loc>https://veromiller.art/paintings/def</loc>')
    expect(body).not.toContain('/administration')
  })
})
