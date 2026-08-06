import { beatmapsSearch } from '@/lib/osu/actions/osu'
import RateLimitManager from '@/lib/limiter/RateLimitManager'
import { BeatmapSet } from '@/types/Osu'
import { MAX_OSU_SEARCH_CONCURRENCY } from '@/variables'

const manager = RateLimitManager.getInstance('osu', { maxConcurrency: MAX_OSU_SEARCH_CONCURRENCY })
export async function POST(req: Request) {
   const { qs } = await req.json()

   const responses = await manager.executeBatch<{ beatmapsets: Array<BeatmapSet>; total: number }>(
      qs.map((q: string) => () => beatmapsSearch({ q, s: 'any' })),
   )
   const results = responses.map((res) => (res && res.total > 0 ? res.beatmapsets : null))

   if (results.every((r) => r === null)) {
      return Response.json([], { status: 404 })
   }
   return Response.json(results, { status: 200 })
}
