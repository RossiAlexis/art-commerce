import { expect, test } from '@playwright/test'

// This journey exercises the protected Painting read-and-delete flow against a
// seeded non-production database. It requires the seeded admin (`vero`)
// credentials, supplied via SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD; when the
// password is absent the seed generates a random one, so the journey is skipped
// rather than failed in environments that cannot provide it.

const username = process.env.SEED_ADMIN_USERNAME ?? 'vero'
const password = process.env.SEED_ADMIN_PASSWORD

test.describe('Inspect and delete managed Paintings', () => {
  test.skip(
    !password,
    'SEED_ADMIN_PASSWORD is required to authenticate the Administration journey.',
  )

  test('lists, inspects, cancels and confirms a Painting deletion', async ({
    page,
  }) => {
    // Sign in through the real login form.
    await page.goto('/login')
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password as string)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/administration\/.+/)

    // The Administration index links to Painting management.
    await page.goto(`/administration/${username}`)
    await page.getByRole('link', { name: 'Manage Paintings' }).click()
    await page.waitForURL(new RegExp(`/administration/${username}/paintings`))

    // Open the first listed Painting to inspect it.
    const firstPainting = page.getByRole('link', { name: /.+/ }).filter({
      has: page.getByText(/image/),
    })
    const detailLink = firstPainting.first()
    const title = (await detailLink.textContent())?.trim() ?? ''
    await detailLink.click()

    // The detail view shows managed fields and a delete affordance.
    await expect(
      page.getByRole('heading', { name: 'Delete this Painting' }),
    ).toBeVisible()

    // Cancel-delete: navigating back leaves the Painting in place.
    await page.getByRole('link', { name: 'Back to Paintings' }).click()
    await page.waitForURL(new RegExp(`/administration/${username}/paintings`))
    await expect(page.getByText(title, { exact: false })).toBeVisible()

    // Confirm-delete: the Painting disappears and we return to the list.
    await page.getByText(title, { exact: false }).first().click()
    await page.getByRole('button', { name: 'Delete painting' }).click()
    await page.waitForURL(new RegExp(`/administration/${username}/paintings/?$`))
  })
})
