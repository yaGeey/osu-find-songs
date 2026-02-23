import { NextResponse } from 'next/server'

export async function GET(req: Request) {
   try {
      const { searchParams } = new URL(req.url)
      const targetUrl = searchParams.get('url')
      if (!targetUrl) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })

      const res = await fetch(targetUrl)
      if (!res.ok) return NextResponse.json({ error: 'Failed to fetch target url' }, { status: 500 })

      const headers = new Headers(res.headers)
      return new Response(res.body, {
         status: res.status,
         headers,
      })
   } catch (err) {
      return new Response('Internal Server Error', { status: 500 })
   }
}
