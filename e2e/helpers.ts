import { expect, type APIRequestContext, type Page } from '@playwright/test'

/** Must match NEXT_PUBLIC_CLIENT_ID_STORAGE_KEY in playwright.config.ts. */
export const CLIENT_ID_STORAGE_KEY = 'e2e-client-id'
export const MOCK_URL = 'http://127.0.0.1:4000'

export const PLAYLIST_ID = '37i9dQZF1DXcBWIGoYBM5M'
export const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`

export type Scenario = 'default' | 'ready' | 'progress' | 'create-error' | 'spotify-notfound' | 'osu-empty'

/** Reset the mock backend to a known scenario before each test. */
export async function setScenario(request: APIRequestContext, scenario: Scenario) {
   const res = await request.post(`${MOCK_URL}/__test/control`, { data: { scenario } })
   expect(res.ok()).toBeTruthy()
}

/**
 * Seed the client id the app reads from localStorage on /from-osu.
 * Runs on every navigation, so it survives reloads.
 */
export async function seedClientId(page: Page) {
   await page.addInitScript((key) => {
      try {
         window.localStorage.setItem(key, 'e2e-client')
      } catch {
         /* ignore storage errors */
      }
   }, CLIENT_ID_STORAGE_KEY)
}
