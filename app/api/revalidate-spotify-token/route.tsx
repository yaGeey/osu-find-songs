import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
   const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SPOTIFY_CLIENT!,
      client_secret: process.env.SPOTIFY_SECRET!,
   });

   try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: body.toString(),
      });
      if (!response.ok) return NextResponse.json(response);      

      const data: {
         access_token: string;
         expires_in: number;
         token_type: string;
      } = await response.json();

      const nextRes = NextResponse.next();
      nextRes.cookies.set('spotifyToken', data.access_token, { path: '/', expires: new Date(Date.now() + data.expires_in * 1000) });
      
      return NextResponse.json(data);
   } catch (error) {
      return NextResponse.json(error);
   }
}