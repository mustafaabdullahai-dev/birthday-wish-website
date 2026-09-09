import { test, expect } from '@playwright/test'

test('landing page renders and offers wish creation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /celebrate/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /create a wish link/i })).toBeVisible()
  await expect(page.getByPlaceholder(/paste the wish link/i)).toBeVisible()
})

test('guestbook opens for a wish link', async ({ page }) => {
  await page.goto('/#/celebrate/sara-abc123')

  // Invalid/unreachable slug -> wish-missing overlay offers to create a wish.
  await expect(page.getByRole('heading', { name: /could not be found/i })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /create your own wish/i }).click()
  await expect(page.getByText(/create a wish link/i)).toBeVisible()
})

test('create-wish flow produces a shareable link', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /create a wish link/i }).click()
  await expect(page.getByText(/someone special/i)).toBeVisible()

  // Step 1: who
  await page.getByPlaceholder('e.g. Sony').fill('Sony')
  await page.getByPlaceholder(/how it should appear/i).fill('Ayesha')
  await page.getByRole('button', { name: /next/i }).click()

  // Step 2: vibe — skip (defaults fine)
  await page.getByRole('button', { name: /next/i }).click()

  // Step 3: memories — skip (defaults fine)
  await page.getByRole('button', { name: /next/i }).click()

  // Step 4: preview + generate
  await page.getByRole('button', { name: /generate the wish link/i }).click()

  // Link appears in a readonly input and is copyable.
  const shareInput = page.locator('input[readonly]').first()
  await expect(shareInput).toBeVisible({ timeout: 10_000 })
  const link = await shareInput.inputValue()
  expect(link).toMatch(/\/#\/celebrate\/.*-\w+$/)

  // QR code should render for the wish link (2-luv-style share).
  await expect(page.locator('.qr-img')).toBeVisible({ timeout: 10_000 })
})

test('essential controls appear on the celebration controls bar', async ({ page }) => {
  // Seed a saved wish link so the landing page offers it under "Jump back in".
  await page.addInitScript(() => {
    localStorage.setItem(
      'bday_wishLinks',
      JSON.stringify([
        {
          id: 'seed-1',
          slug: 'sara-seeded',
          forName: 'Sara',
          fromName: 'Ali',
          emotion: 'joyful',
          message: 'Happy birthday Sara',
          cakeColor: '#FF9E9E',
          theme: '0',
          themePreset: 'classic-gold',
          birthdayKnown: true,
          memories: [],
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  })

  await page.goto('/')

  await page.getByRole('button', { name: /sara/i }).click()

  const controls = page.locator('.controls-bar')
  await expect(controls).toBeVisible({ timeout: 15_000 })
  await expect(controls.getByRole('button', { name: /replay celebration/i })).toBeVisible()
  await expect(controls.getByRole('button', { name: /choose music/i })).toBeVisible()
})