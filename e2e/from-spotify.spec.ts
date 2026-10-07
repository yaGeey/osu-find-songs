import { expect, test } from '@playwright/test'
import { PLAYLIST_ID, PLAYLIST_URL, setScenario } from './helpers'

test.describe('from-spotify', () => {
   test.beforeEach(async ({ request }) => {
      await setScenario(request, 'default')
   })

   test('rejects an invalid link', async ({ page }) => {
      await page.goto('/from-spotify/select')
      await page.getByPlaceholder('Spotify playlist link').fill('not-a-link')
      await expect(page.getByText('Invalid link')).toBeVisible()
   })

   test('rejects an album link', async ({ page }) => {
      await page.goto('/from-spotify/select')
      await page.getByPlaceholder('Spotify playlist link').fill(`https://open.spotify.com/album/${PLAYLIST_ID}`)
      await expect(page.getByText('Albums are not supported')).toBeVisible()
   })

   test('reports a playlist that is not found or private', async ({ page, request }) => {
      await setScenario(request, 'spotify-notfound')
      await page.goto('/from-spotify/select')
      await page.getByPlaceholder('Spotify playlist link').fill(PLAYLIST_URL)
      await expect(page.getByText('Playlist not found or is private')).toBeVisible()
   })

   test('matches a playlist to beatmaps', async ({ page }) => {
      await page.goto('/from-spotify/select')
      await page.getByPlaceholder('Spotify playlist link').fill(PLAYLIST_URL)

      await expect(page).toHaveURL(new RegExp(`/from-spotify/${PLAYLIST_ID}`))
      await expect(page.getByText('E2E Test Playlist')).toBeVisible()
      await expect(page.getByText(/from E2E Artist/).first()).toBeVisible({ timeout: 20_000 })
   })

   test('shows the empty state when nothing matches', async ({ page, request }) => {
      await setScenario(request, 'osu-empty')
      await page.goto(`/from-spotify/${PLAYLIST_ID}`)
      await expect(page.getByText('No results found')).toBeVisible({ timeout: 20_000 })
   })
})
