import { expect, test } from '@playwright/test'
import { seedClientId, setScenario } from './helpers'

test.describe('from-osu', () => {
   test.beforeEach(async ({ page, request }) => {
      await setScenario(request, 'ready')
      await seedClientId(page)
      await page.goto('/from-osu')
   })

   test('shows the setup command for the detected OS', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /paste this command/i })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Windows' })).toBeVisible()
      await expect(page.getByText('/spotify/playlist/').first()).toBeVisible()
   })

   test('unsupported platforms show "not implemented"', async ({ page }) => {
      await page.getByRole('button', { name: 'Mac OS' }).click()
      await expect(page.getByText('Not implemented for now')).toBeVisible()
      await page.getByRole('button', { name: 'Linux' }).click()
      await expect(page.getByText('Not implemented for now')).toBeVisible()
      await page.getByRole('button', { name: 'Windows' }).click()
      await expect(page.getByText('/spotify/playlist/').first()).toBeVisible()
   })

   test('copy button copies the command', async ({ page }) => {
      const command = await page.locator('p[title]').first().getAttribute('title')
      expect(command).toContain('/spotify/playlist/')

      await page.getByTitle('Copy command').click()
      const clipboard = await page.evaluate(() => navigator.clipboard.readText())
      expect(clipboard).toBe(command)
   })

   test('tracks progress and fills the playlist', async ({ page, request }) => {
      await setScenario(request, 'progress')
      await page.reload()

      await expect(page.getByText('Matching your tracks')).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('progressbar')).toBeVisible()

      await expect(page.getByText('Your playlist is ready!')).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('Open in Spotify')).toBeVisible()
      await expect(page.getByRole('button', { name: /start over/i })).toBeVisible()
   })

   test('shows an error when playlist creation fails', async ({ page, request }) => {
      await setScenario(request, 'create-error')
      await page.reload()

      await expect(page.getByText('Failed to create playlist')).toBeVisible()
   })
})
