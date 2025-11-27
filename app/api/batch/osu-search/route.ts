import { beatmapsSearch } from '@/lib/osu'
import pLimit from 'p-limit'
export const revalidate = 0

// pLimit 5 delay 1000 - 15 maps, 24 sec
// nothing - 10 maps, 10 sec
// pLimit - 15 maps, 20 sec
// pLimit 15 - 15, 13 sec
// 15, jitter - 12
// 10, jitter - 16
// 15, 2 jitters - 12

export async function POST(req: Request) {
   const { qs, m, s } = await req.json()

   const limit = pLimit(7)
   const results = await Promise.all(
      qs.map((q: string) =>
         limit(async () => {
            await new Promise((r) => setTimeout(r, Math.random() * 500))
            return beatmapsSearch({ q, m, s }).catch((err) => null)
         }),
      ),
   )
   return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
