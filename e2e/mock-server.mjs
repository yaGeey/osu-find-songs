// Fictional backend for Playwright E2E tests.
//
// One process stands in for every external service the app talks to:
//   - the "local API" microservice (LOCAL_API_URL / NEXT_PUBLIC_LOCAL_API_URL)
//   - Spotify's internal GraphQL (SPOTIFY_API_BASE_URL)
//   - the osu! API + OAuth (OSU_BASE_URL)
//   - the GitHub REST API (GITHUB_API_BASE_URL)
//
// Run:   node e2e/mock-server.mjs        (port 4000; override with MOCK_API_PORT)
//
// Tests drive state through POST /__test/control { scenario }. Everything is in-memory
// and reset on every control call, so tests are deterministic and order-independent.

import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_API_PORT) || 4000

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

/** @typedef {'default'|'ready'|'progress'|'create-error'|'spotify-notfound'|'osu-empty'} Scenario */

/** @type {Scenario} */
let scenario = 'default'

// from-osu state
let playlistCreated = false
let pollCount = 0

// osu search state — makes every matched track a distinct, deterministic beatmapset
let osuSearchCount = 0

function resetState(next) {
   scenario = next
   playlistCreated = false
   pollCount = 0
   osuSearchCount = 0
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CORS = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
   'Access-Control-Allow-Headers': '*',
}

function track(i) {
   return {
      uid: `uid-${i}`,
      addedAt: { isoString: '2024-01-01T00:00:00Z' },
      addedBy: { data: { __typename: 'User', avatar: null, name: 'E2E', uri: 'spotify:user:e2e', username: 'e2e' } },
      attributes: [],
      itemV2: {
         __typename: 'TrackResponseWrapper',
         data: {
            __typename: 'Track',
            name: `E2E Song ${i}`,
            uri: `spotify:track:e2e${i}`,
            artists: { items: [{ profile: { name: `E2E Artist ${i}` }, uri: `spotify:artist:e2e${i}` }], totalCount: 1 },
            albumOfTrack: { artists: { items: [], totalCount: 0 }, coverArt: { sources: [] }, name: 'E2E Album', uri: 'spotify:album:e2e' },
            associationsV3: { audioAssociations: { totalCount: 0 }, videoAssociations: { totalCount: 0 } },
            contentRating: { label: 'NONE' },
            discNumber: 1,
            trackDuration: { totalMilliseconds: 1000 },
            mediaType: 'AUDIO',
            playability: { playable: true, reason: '' },
            playcount: '0',
            trackNumber: i,
         },
      },
      itemV3: {
         __typename: 'EntityResponseWrapper',
         data: {
            __typename: 'Entity',
            consumptionExperienceTrait: { duration: { nanoSeconds: 0, seconds: 1 } },
            identityTrait: { contributors: { items: [], totalCount: 0 }, name: `E2E Song ${i}`, type: 'Song' },
            uri: `spotify:track:e2e${i}`,
            visualIdentityTrait: { sixteenByNineCoverImage: null, squareCoverImage: null },
         },
      },
   }
}

function playlist(name = 'E2E Test Playlist') {
   const items = [1, 2, 3].map(track)
   return {
      __typename: 'Playlist',
      uri: 'spotify:playlist:e2e-playlist',
      name,
      description: '',
      format: '',
      revisionId: '1',
      followers: 1,
      following: false,
      abuseReportingEnabled: false,
      basePermission: 'PUBLIC',
      currentUserCapabilities: {
         canAbuseReport: false,
         canAdministratePermissions: false,
         canCancelMembership: false,
         canEditItems: false,
         canView: true,
      },
      ownerV2: { data: { __typename: 'User', avatar: null, name: 'E2E', uri: 'spotify:user:e2e', username: 'e2e' } },
      members: { totalCount: 1, items: [] },
      images: { items: [] },
      sharingInfo: { shareId: 'e2e', shareUrl: 'https://open.spotify.com/playlist/e2e-playlist' },
      visualIdentity: { squareCoverImage: { __typename: 'VisualIdentityImage', extractedColorSet: {} } },
      content: {
         __typename: 'PlaylistItemsPage',
         items,
         pagingInfo: { limit: 50, offset: 0 },
         totalCount: items.length,
      },
   }
}

function beatmapset(id, artist, title) {
   const covers = {
      cover: `https://assets.ppy.sh/beatmaps/${id}/covers/cover.jpg`,
      'cover@2x': `https://assets.ppy.sh/beatmaps/${id}/covers/cover@2x.jpg`,
      card: `https://assets.ppy.sh/beatmaps/${id}/covers/card.jpg`,
      'card@2x': `https://assets.ppy.sh/beatmaps/${id}/covers/card@2x.jpg`,
      list: `https://assets.ppy.sh/beatmaps/${id}/covers/list.jpg`,
   }
   return {
      bpm: 180,
      id,
      submitted_date: '2023-01-01T00:00:00Z',
      rating: 8.5,
      covers,
      artist,
      beatmaps: [{ mode: 'osu', difficulty_rating: 5.2, version: 'Insane' }],
      creator: 'E2E Mapper',
      favourite_count: 42,
      last_updated: '2023-02-01T00:00:00Z',
      play_count: 123456,
      preview_url: 'https://assets.ppy.sh/preview/e2e.mp3',
      ranked: true,
      ranked_date: '2023-02-01T00:00:00Z',
      status: 'ranked',
      title,
      video: false,
   }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(res, status, payload) {
   res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...CORS })
   res.end(JSON.stringify(payload))
}

function readJson(req) {
   return new Promise((resolve) => {
      let body = ''
      req.setEncoding('utf8')
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
         try {
            resolve(body ? JSON.parse(body) : null)
         } catch {
            resolve(null)
         }
      })
      req.on('error', () => resolve(null))
   })
}

function playlistStatus() {
   const base = { id: 'e2e-playlist', total: 3, found: 0, notFound: 0, errored: 0, added: 0, processed: 0 }

   if (scenario === 'ready') return { ...base, status: 'ready' }

   // progress / default: ready -> processing (twice) -> filled
   pollCount += 1
   if (pollCount <= 1) return { ...base, status: 'ready' }
   if (pollCount <= 3) {
      const processing = pollCount === 2
      return {
         ...base,
         status: 'processing',
         processed: processing ? 1 : 2,
         found: processing ? 1 : 2,
      }
   }
   return { ...base, status: 'filled', processed: 3, found: 3, added: 3, notFound: 0 }
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
   const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
   const path = url.pathname

   if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS)
      return res.end()
   }

   // ---- test control ----
   if (path === '/__test/health') return json(res, 200, { ok: true })
   if (path === '/__test/control' && req.method === 'POST') {
      const body = await readJson(req)
      resetState(body?.scenario ?? 'default')
      return json(res, 200, { ok: true, scenario })
   }

   // ---- local API: internal token (server) ----
   if (path === '/token' && req.method === 'GET') {
      return json(res, 200, {
         access: { clientId: 'e2e-client', accessToken: 'e2e-access-token', accessTokenExpirationTimestampMs: Date.now() + 3600_000 },
         client: { expires_at: Date.now() + 3600_000, token: 'e2e-client-token', version: '1.0.0-e2e' },
      })
   }

   // ---- local API: playlist create + progress (browser) ----
   if (path === '/spotify/playlist' && req.method === 'POST') {
      if (scenario === 'create-error') return json(res, 500, { error: 'e2e create failure' })
      playlistCreated = true
      pollCount = 0
      return json(res, 200, { id: 'e2e-playlist' })
   }
   if (path === '/spotify/playlist' && req.method === 'GET') {
      if (scenario === 'create-error' || !playlistCreated) return json(res, 404, { error: 'not ready' })
      return json(res, 200, playlistStatus())
   }

   // ---- Spotify internal GraphQL (server) ----
   if (path === '/pathfinder/v2/query' && req.method === 'POST') {
      const body = await readJson(req)
      const op = body?.operationName
      if (scenario === 'spotify-notfound') return json(res, 200, { data: { playlistV2: { __typename: 'NotFound' } } })
      if (op === 'fetchPlaylist') return json(res, 200, { data: { playlistV2: playlist() } })
      if (op === 'fetchPlaylistContents') return json(res, 200, { data: { playlistV2: playlist() } })
      return json(res, 200, { data: { playlistV2: { __typename: 'NotFound' } } })
   }

   // ---- osu! OAuth + API (server) ----
   if (path === '/oauth/token' && req.method === 'POST') {
      return json(res, 200, { access_token: 'e2e-osu-token', expires_in: 3600 })
   }
   if (path === '/api/v2/beatmapsets/search' && req.method === 'GET') {
      if (scenario === 'osu-empty') return json(res, 200, { beatmapsets: [], total: 0 })
      osuSearchCount += 1
      const [artist, title] = [`E2E Artist ${osuSearchCount}`, `E2E Song ${osuSearchCount}`]
      return json(res, 200, { beatmapsets: [beatmapset(9000 + osuSearchCount, artist, title)], total: 1 })
   }
   if (path.startsWith('/api/v2/beatmapsets/') && req.method === 'GET') {
      const id = Number(path.split('/').pop()) || 9000
      return json(res, 200, beatmapset(id, 'E2E Artist', 'E2E Song'))
   }

   // ---- GitHub REST (server) ----
   if (path.endsWith('/commits') && req.method === 'GET') {
      return json(res, 200, [{ commit: { author: { date: '2024-01-01T00:00:00Z' } }, html_url: 'https://github.com/yaGeey/osu-find-songs/commit/e2e' }])
   }
   if (path.startsWith('/repos/') && req.method === 'GET') {
      return json(res, 200, { stargazers_count: 123 })
   }

   return json(res, 404, { error: `Nothing here: ${req.method} ${path}` })
})

server.listen(PORT, () => {
   console.log(`[e2e] mock server listening on http://localhost:${PORT}`)
})
