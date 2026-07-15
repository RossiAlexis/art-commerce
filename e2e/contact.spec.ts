import { expect, test } from '@playwright/test'

// These journeys run against a seeded non-production database with Contact
// delivery configured (ARTIST_EMAIL, EMAIL_FROM, RESEND_API_KEY). The seed
// script (`prisma/seed.ts`) creates visible Paintings, each with one image.

test('sends a general Contact message', async ({ page }) => {
  await page.goto('/contact-me')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Contact' }),
  ).toBeVisible()

  await page.getByLabel('Name').fill('Dana Visitor')
  await page.getByLabel('Email').fill('dana@example.test')
  await page
    .getByLabel('Message')
    .fill('Hello Vero, do you take on commissions?')

  await page.getByRole('button', { name: /send message/i }).click()

  await expect(page.getByRole('status')).toContainText(/sent/i)
})

test('rejects an invalid email with an actionable error', async ({ page }) => {
  await page.goto('/contact-me')

  await page.getByLabel('Name').fill('Dana Visitor')
  // A malformed email that clears native validation but fails the Zod schema.
  await page.getByLabel('Email').evaluate((el: HTMLInputElement) => {
    el.value = 'not-an-email'
  })
  await page.getByLabel('Message').fill('A message body.')

  await page.getByRole('button', { name: /send message/i }).click()

  await expect(page.getByRole('alert')).toContainText(/email/i)
})

test('starts a Painting inquiry with prefilled context', async ({ page }) => {
  await page.goto('/paintings')
  const firstPainting = page.locator('a[href^="/paintings/"]').first()
  await firstPainting.click()

  const title = await page.getByRole('heading', { level: 1 }).textContent()

  await page.getByRole('link', { name: /inquire about this painting/i }).click()

  await expect(page).toHaveURL(/\/contact-me\?q=.+/)
  await expect(page.getByRole('note')).toContainText(title ?? '')
})

test('shows an availability notice for a stale Painting reference', async ({
  page,
}) => {
  await page.goto('/contact-me?q=does-not-exist')

  await expect(page.getByRole('note')).toContainText(/no longer available/i)
  // The general form remains usable.
  await expect(page.getByLabel('Message')).toBeVisible()
})
