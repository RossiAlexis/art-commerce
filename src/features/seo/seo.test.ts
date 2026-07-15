import { describe, expect, it } from 'vitest'

import {
  PUBLIC_STATIC_PATHS,
  buildRobotsTxt,
  buildSitemapXml,
  noindexMeta,
} from './seo'

describe('buildSitemapXml', () => {
  it('lists the public static routes with absolute URLs', () => {
    const xml = buildSitemapXml('https://veromiller.art', [])

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
    expect(xml).toContain('<loc>https://veromiller.art/</loc>')
    expect(xml).toContain('<loc>https://veromiller.art/paintings</loc>')
    expect(xml).toContain('<loc>https://veromiller.art/contact-me</loc>')
  })

  it('includes a detail URL for each publicly visible Painting', () => {
    const xml = buildSitemapXml('https://veromiller.art', ['abc', 'def'])

    expect(xml).toContain('<loc>https://veromiller.art/paintings/abc</loc>')
    expect(xml).toContain('<loc>https://veromiller.art/paintings/def</loc>')
  })

  it('excludes login, administration, resource, and error routes', () => {
    const xml = buildSitemapXml('https://veromiller.art', ['abc'])

    expect(xml).not.toContain('/login')
    expect(xml).not.toContain('/logout')
    expect(xml).not.toContain('/administration')
    expect(xml).not.toContain('/resources')
  })

  it('normalises a trailing slash on the origin', () => {
    const xml = buildSitemapXml('https://veromiller.art/', ['abc'])

    expect(xml).toContain('<loc>https://veromiller.art/</loc>')
    expect(xml).toContain('<loc>https://veromiller.art/paintings/abc</loc>')
    expect(xml).not.toContain('veromiller.art//')
  })

  it('escapes special characters in Painting identifiers', () => {
    const xml = buildSitemapXml('https://veromiller.art', ['a&b'])

    expect(xml).toContain('<loc>https://veromiller.art/paintings/a&amp;b</loc>')
    expect(xml).not.toContain('a&b</loc>')
  })
})

describe('buildRobotsTxt', () => {
  it('references the sitemap and blocks everything when indexing is disabled', () => {
    const robots = buildRobotsTxt('https://veromiller.art', false)

    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Disallow: /')
    expect(robots).toContain('Sitemap: https://veromiller.art/sitemap.xml')
    expect(robots).not.toContain('Allow: /')
  })

  it('allows public crawling but disallows private routes when indexing is enabled', () => {
    const robots = buildRobotsTxt('https://veromiller.art', true)

    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Disallow: /administration')
    expect(robots).toContain('Disallow: /login')
    expect(robots).toContain('Disallow: /logout')
    expect(robots).toContain('Disallow: /resources')
    expect(robots).toContain('Sitemap: https://veromiller.art/sitemap.xml')
  })
})

describe('PUBLIC_STATIC_PATHS', () => {
  it('is limited to the public discovery routes', () => {
    expect(PUBLIC_STATIC_PATHS).toEqual(['/', '/paintings', '/contact-me'])
  })
})

describe('noindexMeta', () => {
  it('marks a route as non-indexable', () => {
    expect(noindexMeta()).toEqual([
      { name: 'robots', content: 'noindex, nofollow' },
    ])
  })
})
