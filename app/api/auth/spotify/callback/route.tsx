import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
   const searchParams = req.nextUrl.searchParams
   const code = searchParams.get('code')
   if (!code) return NextResponse.redirect(new URL('/', req.url))

   const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
      client_id: process.env.AUTH_SPOTIFY_ID!,
      client_secret: process.env.AUTH_SPOTIFY_SECRET!,
   })

   const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
   })

   if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching token:', error)
      return NextResponse.redirect(new URL('/error', req.url))
   }

   const data = await response.json()

   if (data.error) {
      console.error('Error in token response:', data.error)
      return NextResponse.redirect(new URL('/error', req.url))
   }

   const nextResponse = NextResponse.redirect(new URL('/from-osu', req.url))
   nextResponse.cookies.set('spotify_oauth_access_token', data.access_token, {
      // httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      maxAge: data.expires_in,
   })

   return nextResponse
}
