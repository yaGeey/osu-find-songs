import { beatmapsSearch } from '@/lib/osu/actions/osu'
import RateLimitManager from '@/lib/limiter/RateLimitManager'
import { BeatmapSetFromSpotify } from '@/types/Osu'

const MAX_OSU_SEARCH_CONCURRENCY = 3
const MAX_QUERIES_PER_REQUEST = 50

const manager = RateLimitManager.getInstance('osu', { maxConcurrency: MAX_OSU_SEARCH_CONCURRENCY })
export async function POST(req: Request) {
   let body: unknown
   try {
      body = await req.json()
   } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
   }

   const qs = (body as { qs?: unknown } | null)?.qs
   if (!Array.isArray(qs)) {
      return Response.json({ error: 'Expected { qs: string[] }' }, { status: 400 })
   }

   const queries = qs
      .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      .slice(0, MAX_QUERIES_PER_REQUEST)
   if (queries.length === 0) {
      return Response.json([], { status: 404 })
   }

   try {
      const responses = await manager.executeBatch<{ beatmapsets: BeatmapSetFromSpotify[]; total: number }>(
         queries.map((q) => () => beatmapsSearch({ q, s: 'any' })),
      )
      const results = responses.map((res) => (res && res.total > 0 ? res.beatmapsets : null))

      if (results.every((r) => r === null)) {
         return Response.json([], { status: 404 })
      }
      return Response.json(results, { status: 200 })
   } catch (err) {
      console.error('[osu-search] batch failed', err)
      return Response.json({ error: 'Search failed' }, { status: 500 })
   }
}
