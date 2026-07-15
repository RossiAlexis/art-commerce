import { expect, test } from '@playwright/test'

// SEO endpoints derive from the same public-visibility rules as the portfolio.
// These journeys run against a seeded non-production database whose seed script
// (`prisma/seed.ts`) creates visible Paintings.

test('serves a public-only sitemap.xml', async ({ request }) => {
  const response = await request.get('/sitemap.xml')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('xml')

  const body = await response.text()
  expect(body).toContain('<loc>')
  expect(body).toMatch(/\/paintings<\/loc>/)
  expect(body).toMatch(/\/contact-me<\/loc>/)
  // Publicly visible Painting detail URLs are present.
  expect(body).toMatch(/\/paintings\/[^<]+<\/loc>/)
  // Private, resource, and error routes never appear.
  expect(body).not.toContain('/administration')
  expect(body).not.toContain('/login')
  expect(body).not.toContain('/logout')
  expect(body).not.toContain('/resources')
})

test('serves robots.txt referencing the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/plain')

  const body = await response.text()
  expect(body).toContain('User-agent: *')
  expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/)
})

test('marks the login page as non-indexable', async ({ page }) => {
  await page.goto('/login')

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  )
})

test('renders a branded 404 with the correct status for unknown routes', async ({
  page,
}) => {
  const response = await page.goto('/this-route-does-not-exist')

  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'This page could not be found' }),
  ).toBeVisible()
})

test('returns a 404 for a missing Painting detail URL', async ({ page }) => {
  const response = await page.goto('/paintings/does-not-exist')

  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'This page could not be found' }),
  ).toBeVisible()
})
