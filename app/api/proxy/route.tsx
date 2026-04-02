import { NextResponse } from 'next/server'

export async function GET(req: Request) {
   try {
      const { searchParams } = new URL(req.url)
      const targetUrl = searchParams.get('url')
      if (!targetUrl) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })

      const res = await fetch(targetUrl, {
         redirect: 'follow',
      })

      const headers = new Headers(res.headers)

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
   } catch {
      return new Response('Internal Server Error', { status: 500 })
   }
}
