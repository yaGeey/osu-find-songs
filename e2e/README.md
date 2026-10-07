# E2E tests (Playwright)

Deterministic, Chromium-only end-to-end tests for the two main features:

- **from-spotify** — paste a playlist link → it is matched to osu! beatmaps.
- **from-osu** — a playlist is created, the setup command is shown, progress is polled until filled.

No real Spotify / osu! / GitHub / Neon credentials are needed: `e2e/mock-server.mjs` stands in
for every external service, and `playwright.config.ts` starts both the mock server and a
`next dev` instance pointed at it.

## Run

```bash
npm run test:e2e:install   # once: downloads Chromium
npm run test:e2e           # headless run
npm run test:e2e:ui        # interactive UI mode
```

The suite starts its own servers, so it does not need (or interfere with) a running dev server.

## How the mocking works

Next.js server actions / server components cannot be intercepted with `page.route`, so the
external services are redirected at the HTTP boundary via small, inert-by-default env seams:

| Service | Env var | Default |
| --- | --- | --- |
| Spotify internal GraphQL | `SPOTIFY_API_BASE_URL` | `https://api-partner.spotify.com` |
| osu! API + OAuth | `OSU_BASE_URL` | `https://osu.ppy.sh` |
| GitHub REST | `GITHUB_API_BASE_URL` | `https://api.github.com` |
| Local processing API | `LOCAL_API_URL` / `NEXT_PUBLIC_LOCAL_API_URL` | (already configurable) |

`e2e/mock-server.mjs` also exposes `POST /__test/control { scenario }`, which resets its state.
Because that state is global, the tests run with a single worker (`workers: 1`).

Supported scenarios: `default`, `ready`, `progress`, `create-error`, `spotify-notfound`, `osu-empty`.
