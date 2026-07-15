import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// These journeys run against a seeded non-production database. The seed script
// (`prisma/seed.ts`) creates the admin user `vero` (password from
// SEED_ADMIN_PASSWORD) and the single text-only Homepage record. A valid
// SEED_ADMIN_PASSWORD must be exported for the login step to succeed.

const username = 'vero'
const password = process.env.SEED_ADMIN_PASSWORD ?? ''

const onePixelPng =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Wl3ZAAAAAElFTkSuQmCC'

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/administration\//)
}

test.beforeEach(() => {
  test.skip(!password, 'SEED_ADMIN_PASSWORD is required to sign in.')
})

test('edits the Homepage title and text and shows it on the public page', async ({
  page,
}) => {
  await signIn(page)
  await page.goto(`/administration/${username}/homepage`)

  const uniqueTitle = `Vero Miller Studio ${Date.now()}`
  await page.getByLabel('Title').fill(uniqueTitle)
  await page.getByLabel('Text').fill('Original paintings and commissions.')
  await page.getByRole('button', { name: 'Save title & text' }).click()

  await expect(page.getByRole('status')).toContainText('updated')

  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: uniqueTitle }),
  ).toBeVisible()
})

test('adds, replaces, and removes the optional Homepage image', async ({
  page,
}) => {
  await signIn(page)
  await page.goto(`/administration/${username}/homepage`)

  const png = Buffer.from(onePixelPng, 'base64')

  // Add
  await page.getByLabel(/Add image|Replace image/).setInputFiles({
    name: 'home.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await page.getByLabel('Alt text (optional)').fill('Vero in her studio')
  await page.getByRole('button', { name: /Upload image|Replace image/ }).click()
  await expect(page.getByRole('status')).toContainText('saved')
  await expect(
    page.locator('img[src^="/resources/homepage-image/"]'),
  ).toBeVisible()

  // Replace
  await page.getByLabel('Replace image').setInputFiles({
    name: 'home-2.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await page.getByRole('button', { name: 'Replace image' }).click()
  await expect(page.getByRole('status')).toContainText('saved')

  // Remove
  await page.getByRole('button', { name: 'Remove image' }).click()
  await expect(page.getByRole('status')).toContainText('removed')
  await expect(
    page.locator('img[src^="/resources/homepage-image/"]'),
  ).toHaveCount(0)
})
