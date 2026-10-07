import { defineConfig, devices } from '@playwright/test'

const APP_PORT = 3100
const MOCK_PORT = 4000
const APP_URL = `http://localhost:${APP_PORT}`
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}`

// Env handed to `next dev` so every external service points at the mock server.
// Runtime process.env wins over .env files in Next.js, so this overrides local secrets.
const e2eEnv: Record<string, string> = {
   NEXT_PUBLIC_LOCAL_API_URL: MOCK_URL,
   LOCAL_API_URL: MOCK_URL,
   LOCAL_API_SECRET: 'e2e-secret',
   SPOTIFY_API_BASE_URL: MOCK_URL,
   OSU_BASE_URL: MOCK_URL,
   GITHUB_API_BASE_URL: MOCK_URL,
   // Unreachable on purpose: telemetry actions fall back gracefully (see REVIEW.md C7).
   DATABASE_URL: 'postgresql://e2e:e2e@127.0.0.1:1/e2e',
   GH_PAT: 'e2e-gh-pat',
   OSU_CLIENT: 'e2e-osu-client',
   OSU_SECRET: 'e2e-osu-secret',
   NEXT_PUBLIC_PUSHER_KEY: 'e2e0000000000000000000000000000',
   NEXT_PUBLIC_PUSHER_CLUSTER: 'us2',
   NEXT_PUBLIC_CLIENT_ID_STORAGE_KEY: 'e2e-client-id',
   NEXT_TELEMETRY_DISABLED: '1',
}

/** process.env without the `undefined` values Playwright rejects, plus the overrides. */
function serverEnv(extra: Record<string, string> = {}): Record<string, string> {
   const out: Record<string, string> = {}
   for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) out[key] = value
   }
   return { ...out, ...extra }
}

export default defineConfig({
   testDir: './e2e',
   // The mock backend keeps a single global scenario, so tests must not run concurrently.
   fullyParallel: false,
   forbidOnly: !!process.env.CI,
   retries: process.env.CI ? 1 : 0,
   workers: 1,
   reporter: [['list'], ['html', { open: 'never' }]],
   use: {
      baseURL: APP_URL,
      trace: 'on-first-retry',
      permissions: ['notifications', 'clipboard-read', 'clipboard-write'],
   },
   projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
   webServer: [
      {
         command: 'node e2e/mock-server.mjs',
         url: `${MOCK_URL}/__test/health`,
         reuseExistingServer: !process.env.CI,
         timeout: 30_000,
         env: serverEnv({ MOCK_API_PORT: String(MOCK_PORT) }),
      },
      {
         command: `npm run dev -- --port ${APP_PORT}`,
         url: APP_URL,
         reuseExistingServer: !process.env.CI,
         timeout: 180_000,
         env: serverEnv(e2eEnv),
      },
   ],
})
