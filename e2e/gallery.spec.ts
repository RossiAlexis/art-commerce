import { expect, test } from '@playwright/test'

// These journeys run against a seeded non-production database. The seed script
// (`prisma/seed.ts`) creates four visible Paintings and no Categories, so the
// unfiltered gallery always shows work and any `?q=` value is an unavailable
// Category. Both journeys are exercised on the desktop and mobile projects
// configured in `playwright.config.ts`.

test('browses the unfiltered gallery', async ({ page }) => {
  await page.goto('/paintings')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Paintings' }),
  ).toBeVisible()

  const firstPainting = page.locator('a[href^="/paintings/"]').first()
  await expect(firstPainting).toBeVisible()

  // Every visible Painting exposes an image with managed alt text or a title
  // fallback, so no image is left unlabelled.
  for (const image of await page.locator('main img').all()) {
    await expect(image).toHaveAttribute('alt', /.+/)
  }
})

test('preserves the filtered URL and explains an unavailable Category', async ({
  page,
}) => {
  await page.goto('/paintings?q=deleted-category')

  await expect(page).toHaveURL(/\/paintings\?q=deleted-category$/)
  await expect(page.getByText('no longer available')).toBeVisible()
})

test('filters by a Category link when one is available', async ({ page }) => {
  await page.goto('/paintings')

  const filter = page
    .getByRole('navigation', { name: 'Filter Paintings by Category' })
    .getByRole('link')
    .filter({ hasNotText: 'All' })
    .first()

  test.skip(
    (await filter.count()) === 0,
    'No public Categories are seeded to filter by.',
  )

  await filter.click()
  await expect(page).toHaveURL(/\/paintings\?q=.+/)
})
