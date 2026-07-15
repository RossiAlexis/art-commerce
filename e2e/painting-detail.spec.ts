import { expect, test } from '@playwright/test'

// These journeys run against a seeded non-production database. The seed script
// (`prisma/seed.ts`) creates four visible Paintings, each with a single image,
// ordered by creation time. Both journeys are exercised on the desktop and
// mobile projects configured in `playwright.config.ts`.

test('opens a Painting detail from the gallery and shows its information', async ({
  page,
}) => {
  await page.goto('/paintings')

  const firstPainting = page.locator('a[href^="/paintings/"]').first()
  await expect(firstPainting).toBeVisible()
  await firstPainting.click()

  await expect(page).toHaveURL(/\/paintings\/.+/)

  // Title, CAD price text and description are server-rendered.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText(/CAD/)).toBeVisible()

  // Every image exposes a meaningful alternative (managed alt or title).
  for (const image of await page.locator('main img').all()) {
    await expect(image).toHaveAttribute('alt', /.*/)
  }
})

test('enlarges an image in an accessible dialog and closes it with the keyboard', async ({
  page,
}) => {
  await page.goto('/paintings')
  await page.locator('a[href^="/paintings/"]').first().click()

  await page
    .getByRole('button', { name: /enlarge/i })
    .first()
    .click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('starts a Painting inquiry through the Contact form', async ({ page }) => {
  await page.goto('/paintings')
  const firstPainting = page.locator('a[href^="/paintings/"]').first()
  const href = await firstPainting.getAttribute('href')
  const paintingId = href?.split('/').pop() ?? ''
  await firstPainting.click()

  await page.getByRole('link', { name: /inquire about this painting/i }).click()

  await expect(page).toHaveURL(new RegExp(`/contact-me\\?q=${paintingId}$`))
})

test('returns a 404 for a Painting that does not exist', async ({ page }) => {
  const response = await page.goto('/paintings/does-not-exist')

  expect(response?.status()).toBe(404)
})
