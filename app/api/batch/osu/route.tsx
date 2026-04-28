import RateLimitManager from '@/lib/limiter/RateLimitManager'
import { getBeatmap } from '@/lib/osu/actions/osu'
import { BeatmapSet } from '@/types/Osu'

const manager = RateLimitManager.getInstance('osu', { maxConcurrency: 3 })
export async function GET(req: Request) {
   const { searchParams } = new URL(req.url)
   const ids = searchParams.getAll('id')

   const res = await manager.executeBatch<BeatmapSet>(ids.map((id) => () => getBeatmap(id)))

   if (res.every((s) => s === null) || res.length === 0) {
      return new Response('No beatmaps found', { status: 404 })
   }

   return new Response(JSON.stringify(res), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
