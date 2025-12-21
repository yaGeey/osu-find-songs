import { beatmapsSearchV2 } from '@/lib/osu'
import { AxiosResponse } from 'axios'
import RateLimitManager from '@/lib/api/RateLimitManager'
export const revalidate = 0

const manager = RateLimitManager.getInstance('osu', { maxConcurrency: 3, defaultDelayMs: 500 })
export async function POST(req: Request) {
   const { qs, m, s } = await req.json()

   const responses = await manager.executeBatch<AxiosResponse<any>>(qs.map((q: string) => () => beatmapsSearchV2({ q, m, s })))
   const results = responses.map((res) => (res && res.data ? res.data.beatmapsets : null))

   return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
