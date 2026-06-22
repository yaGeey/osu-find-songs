import { NextResponse } from 'next/server'

const FORWARDED_HEADERS = ['Authorization', 'Referer']

export async function GET(req: Request) {
   const { searchParams } = new URL(req.url)
   const targetUrl = searchParams.get('url')
   if (!targetUrl) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })

   const forwardHeaders: Record<string, string> = {}
   for (const h of FORWARDED_HEADERS) {
      const v = req.headers.get(h)
      if (v) forwardHeaders[h] = v
   }

   const res = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
         ...forwardHeaders,
         'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      },
   })

   const headers = new Headers(res.headers)
   headers.set('Access-Control-Expose-Headers', '*')

   // Prevent browser decoding mismatches when streaming proxied bodies. hop-by-hop headers
   headers.delete('content-encoding')
   headers.delete('content-length')
   headers.delete('transfer-encoding')
   headers.delete('connection')
   headers.delete('keep-alive')
   headers.delete('proxy-authenticate')
   headers.delete('proxy-authorization')
   headers.delete('te')
   headers.delete('trailer')
   headers.delete('upgrade')

   return new Response(res.body, {
      status: res.status,
      headers,
   })
}
