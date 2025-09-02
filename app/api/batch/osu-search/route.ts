import { beatmapsSearch } from '@/lib/osu'
export const revalidate = 0

export async function POST(req: Request) {
   const { qs, m, s } = await req.json()
   const promises = await Promise.allSettled(qs.map((q: string) => beatmapsSearch({ q, m, s })))
   const results = promises.map((r) => (r.status === 'fulfilled' && r.value ? r.value : null))

   return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
