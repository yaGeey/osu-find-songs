import { beatmapsSearch } from '@/lib/osu/actions/osu'
import RateLimitManager from '@/lib/api/RateLimitManager'
import { BeatmapSet } from '@/types/Osu'
export const revalidate = 0

const manager = RateLimitManager.getInstance('osu', { maxConcurrency: 3 })
export async function POST(req: Request) {
   const { qs, m, s } = await req.json()

   const responses = await manager.executeBatch<{ beatmapsets: Array<BeatmapSet>; total: number }>(
      qs.map((q: string) => () => beatmapsSearch({ q, m, s })),
   )
   const results = responses.map((res) => (res && res.total > 0 ? res.beatmapsets : null))

   if (results.every((r) => r === null)) {
      return new Response('No results found', {
         status: 404,
         headers: { 'Content-Type': 'application/json' },
      })
   }

   return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
