import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SPOTIFY_CLIENT!,
      client_secret: process.env.SPOTIFY_SECRET!,
   })

   try {
      const {data} = await axios.post<{
         access_token: string
         expires_in: number
         token_type: string
      }>('https://accounts.spotify.com/api/token', body.toString(), {
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const nextRes = NextResponse.next()
      nextRes.cookies.set('spotifyToken', data.access_token, {
         path: '/',
         expires: new Date(Date.now() + data.expires_in * 1000),
      })

      return NextResponse.json(data)
   } catch (error) {
      return NextResponse.json(error)
   }
}
