import { expect, test } from '@playwright/test'

// This journey exercises the complete Administration-to-public Category flow
// against a seeded non-production database. It requires the seeded admin
// (`vero`) credentials, supplied via SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD;
// when the password is absent the seed generates a random one, so the journey
// is skipped rather than failed in environments that cannot provide it.

const username = process.env.SEED_ADMIN_USERNAME ?? 'vero'
const password = process.env.SEED_ADMIN_PASSWORD

// A label unlikely to collide with existing data; also used to assert ordering.
const managementName = 'Playwright E2E Works'
const navigationLabel = 'ZZ Playwright'
const editedNavigationLabel = 'AA Playwright'

test.describe('Manage Categories end to end', () => {
  test.skip(
    !password,
    'SEED_ADMIN_PASSWORD is required to authenticate the Administration journey.',
  )

  test('creates, edits, and deletes a Category and reflects it publicly', async ({
    page,
  }) => {
    // Sign in through the real login form.
    await page.goto('/login')
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password as string)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/administration\/.+/)

    // Create a Category from the management area.
    await page.goto(`/administration/${username}/categories`)
    await page.getByRole('link', { name: 'New category' }).click()
    await page.getByLabel('Management name').fill(managementName)
    await page.getByLabel('Public navigation label').fill(navigationLabel)
    await page.getByRole('button', { name: 'Create category' }).click()

    await expect(
      page.getByRole('link', { name: new RegExp(managementName) }),
    ).toBeVisible()

    // The new public navigation label appears in the gallery filter nav.
    await page.goto('/paintings')
    const filterNav = page.getByRole('navigation', {
      name: 'Filter Paintings by Category',
    })
    await expect(
      filterNav.getByRole('link', { name: navigationLabel }),
    ).toBeVisible()

    // Edit the public navigation label.
    await page.goto(`/administration/${username}/categories`)
    await page.getByRole('link', { name: new RegExp(managementName) }).click()
    const labelInput = page.getByLabel('Public navigation label')
    await labelInput.fill(editedNavigationLabel)
    await page.getByRole('button', { name: 'Save changes' }).click()

    await page.goto('/paintings')
    await expect(
      filterNav.getByRole('link', { name: editedNavigationLabel }),
    ).toBeVisible()
    await expect(
      filterNav.getByRole('link', { name: navigationLabel }),
    ).toHaveCount(0)

    // Delete the Category after acknowledging the uncategorization warning.
    await page.goto(`/administration/${username}/categories`)
    await page.getByRole('link', { name: new RegExp(managementName) }).click()
    await expect(page.getByText(/uncategorized/i)).toBeVisible()
    await page.getByRole('button', { name: 'Delete category' }).click()

    await expect(
      page.getByRole('link', { name: new RegExp(managementName) }),
    ).toHaveCount(0)

    // The public navigation no longer offers the deleted Category.
    await page.goto('/paintings')
    await expect(
      filterNav.getByRole('link', { name: editedNavigationLabel }),
    ).toHaveCount(0)
  })
})
