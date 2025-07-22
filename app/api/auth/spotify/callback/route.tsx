import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'

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
   
   try {
      const { data } = await axios.post('https://accounts.spotify.com/api/token', body.toString(), {
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const nextResponse = NextResponse.redirect(new URL('/from-osu/select', req.url))
      nextResponse.cookies.set('spotify_oauth_access_token', data.access_token, {
         secure: process.env.NODE_ENV === 'production',
         maxAge: data.expires_in,
      })
      return nextResponse
   } catch (error) {
      if (axios.isAxiosError(error)) {
         console.error('Spotify token exchange error:', error.response?.data)
      } else {
         console.error('An unexpected error occurred:', error)
      }
      console.error('body', body.toString())
      return NextResponse.json(error, { status: (error as AxiosError).response?.status || 500 })
   }
}
