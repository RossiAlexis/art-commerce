import { expect, test } from '@playwright/test'

// This journey exercises the protected Painting create/edit + image upload flow
// against a seeded non-production database. It requires the seeded admin
// (`vero`) credentials via SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD; when the
// password is absent the seed generates a random one, so the journey is skipped
// rather than failed in environments that cannot provide it.

const username = process.env.SEED_ADMIN_USERNAME ?? 'vero'
const password = process.env.SEED_ADMIN_PASSWORD

// A 1x1 transparent PNG — a genuine raster image the server sniff accepts.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMCAn8B3S8AAAAASUVORK5CYII=',
  'base64',
)
// SVG bytes disguised with a PNG mime type — the server must reject the spoof.
const SPOOFED_SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" />')

test.describe('Create and edit a Painting with images', () => {
  test.skip(
    !password,
    'SEED_ADMIN_PASSWORD is required to authenticate the Administration journey.',
  )

  test('creates a Painting, manages images, and enforces upload validation', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password as string)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/administration\/.+/)

    // Start a new Painting from the management index.
    await page.goto(`/administration/${username}/paintings`)
    await page.getByRole('link', { name: 'New painting' }).click()
    await page.waitForURL(
      new RegExp(`/administration/${username}/paintings/new`),
    )

    // Required fields; pick the first seeded Category.
    const title = `Test Painting ${Date.now()}`
    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Price').fill('CAD 950')
    await page.getByLabel('Measurements').fill('20 x 30 cm')
    await page.getByLabel('Category').selectOption({ index: 1 })
    await page.getByLabel('Description').fill('An end-to-end test painting.')
    await page.getByRole('button', { name: 'Create painting' }).click()

    // Redirected to the edit page, which owns image management.
    await page.waitForURL(
      new RegExp(`/administration/${username}/paintings/.+/edit`),
    )
    await expect(
      page.getByRole('heading', { name: new RegExp(`Edit ${title}`) }),
    ).toBeVisible()

    // A spoofed SVG-as-PNG upload is rejected server-side.
    await page.getByLabel('Add image').setInputFiles({
      name: 'evil.png',
      mimeType: 'image/png',
      buffer: SPOOFED_SVG,
    })
    await page.getByRole('button', { name: 'Upload image' }).click()
    await expect(page.getByRole('alert')).toBeVisible()

    // A genuine PNG uploads and previews.
    await page
      .getByLabel('Add image')
      .setInputFiles({ name: 'ok.png', mimeType: 'image/png', buffer: PNG_1X1 })
    await page.getByRole('button', { name: 'Upload image' }).click()
    await expect(page.getByRole('status')).toContainText('Image added.')
    await expect(
      page.locator('img[src^="/resources/note-images/"]'),
    ).toHaveCount(1)

    // Remove it: the Painting stays manageable but image-less.
    await page.getByRole('button', { name: 'Remove image' }).click()
    await expect(page.getByRole('status')).toContainText('Image removed.')
    await expect(page.getByText('No images yet.')).toBeVisible()
  })
})
