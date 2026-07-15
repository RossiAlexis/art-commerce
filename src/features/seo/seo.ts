/**
 * SEO service: the single source of truth for the public sitemap, robots
 * policy, and the non-indexable marker applied to private routes. All output
 * derives from the same public-visibility rules as the portfolio itself, so a
 * Painting appears in the sitemap only when it is publicly viewable.
 */

/** Public discovery routes exposed to search engines (US 26). */
export const PUBLIC_STATIC_PATHS = ['/', '/paintings', '/contact-me'] as const

/** Private/error surfaces that must never be advertised for indexing. */
const DISALLOWED_PATHS = [
  '/administration',
  '/login',
  '/logout',
  '/resources',
] as const

const ROBOTS_NOINDEX = 'noindex, nofollow'

function normaliseOrigin(origin: string): string {
  return origin.replace(/\/+$/, '')
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function loc(origin: string, path: string): string {
  return `  <url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`
}

/**
 * Render a public-only `sitemap.xml`. Static discovery routes come first,
 * followed by a detail URL for each publicly visible Painting id. Login,
 * Administration, resource, and error routes are intentionally absent.
 */
export function buildSitemapXml(
  origin: string,
  paintingIds: ReadonlyArray<string>,
): string {
  const base = normaliseOrigin(origin)

  const urls = [
    ...PUBLIC_STATIC_PATHS.map((path) => loc(base, path)),
    ...paintingIds.map((id) => loc(base, `/paintings/${id}`)),
  ]

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/**
 * Render `robots.txt`. It always points crawlers at the sitemap. When indexing
 * is disabled (previews, development) the whole site is blocked; when enabled,
 * public routes are crawlable while private surfaces stay disallowed.
 */
export function buildRobotsTxt(origin: string, allowIndexing: boolean): string {
  const base = normaliseOrigin(origin)

  const rules = allowIndexing
    ? ['Allow: /', ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`)]
    : ['Disallow: /']

  return [
    'User-agent: *',
    ...rules,
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')
}

/** Head meta that marks a private route as non-indexable. */
export function noindexMeta(): Array<{ name: string; content: string }> {
  return [{ name: 'robots', content: ROBOTS_NOINDEX }]
}
