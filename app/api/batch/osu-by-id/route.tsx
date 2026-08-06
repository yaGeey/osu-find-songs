import RateLimitManager from '@/lib/limiter/RateLimitManager'
import { getBeatmapById } from '@/lib/osu/actions/osu'
import { BeatmapSetFromOsu } from '@/types/Osu'

const manager = RateLimitManager.getInstance('osu-by-id', { maxConcurrency: 3 })
export async function GET(req: Request) {
   const { searchParams } = new URL(req.url)
   const ids = searchParams.getAll('id')

   const res = await manager.executeBatch<BeatmapSetFromOsu>(ids.map((id) => () => getBeatmapById(id)))

   if (res.every((s) => s === null) || res.length === 0) {
      return Response.json([], { status: 404 })
   }
   return Response.json(res, { status: 200 })
}
