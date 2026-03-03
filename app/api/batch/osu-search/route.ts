import { beatmapsSearch } from '@/lib/osu/osu'
import RateLimitManager from '@/lib/api/RateLimitManager'
import { BeatmapSet } from '@/types/Osu'
export const revalidate = 0

// TODO ratelimitmanager blocks others user request, because it's on server. fix it
// also, in spotify dont use ratelimitmanager - unify it
const manager = RateLimitManager.getInstance('osu', { maxConcurrency: 3, defaultDelayMs: 500 })
export async function POST(req: Request) {
   const { qs, m, s } = await req.json()

   const responses = await manager.executeBatch<{ beatmapsets: Array<BeatmapSet>; total: number }>(
      qs.map((q: string) => () => beatmapsSearch({ q, m, s })),
   )
   const results = responses.map((res) => (res && res.total > 0 ? res.beatmapsets : null))

   return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
