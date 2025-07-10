import { revalidateSpotifyToken, searchSongWithConditions } from '@/lib/Spotify'
import { Track, TrackFull } from '@/types/Spotify'
import { Song } from '@/types/types'
import { cookies } from 'next/headers'
const BATCH_SIZE = 50
/* TODO
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at POST (file://D%3A/Apps/VS%20Code%20Projects/osu-find-songs/app/api/batch/spotify/route.tsx:8:35)
   6 |
   7 | export async function POST(req: Request) {
>  8 |    const songs: Song[] = await req.json()
     |                                   ^
   9 |    console.log('Received songs:', songs)
  10 |
  11 |    if (!songs.length || songs.length > BATCH_SIZE)
 ⨯ SyntaxError: Unexpected end of JSON input
*/
export async function POST(req: Request) {
   const songs: Song[] = await req.json()

   if (!songs.length || songs.length > BATCH_SIZE)
      return new Response(JSON.stringify({ error: `No songs provided or more than ${BATCH_SIZE}` }), {
         status: 400,
         headers: { 'Content-Type': 'application/json' },
      })

   let token = (await cookies()).get('spotifyToken')?.value
   if (!token) token = await revalidateSpotifyToken()
   
   const result = await Promise.all(songs.map((song) => searchSongWithConditions(song, token)))
   const filtered = result.filter(Boolean) as TrackFull[][]
   const simplified: Track[][] = filtered.map((batch) =>
      batch?.map((item: Track) => ({
         album: {
            album_type: item.album.album_type,
            external_urls: item.album.external_urls,
            name: item.album.name,
            images: item.album.images,
            release_date: item.album.release_date,
            release_date_precision: item.album.release_date_precision,
            type: item.album.type,
         },
         artists: item.artists.map((artist) => ({
            name: artist.name,
            external_urls: artist.external_urls,
            href: artist.href,
         })),
         duration_ms: item.duration_ms,
         external_urls: item.external_urls,
         name: item.name,
         popularity: item.popularity,
         uri: item.uri,
      })),
   )

   return new Response(JSON.stringify(simplified), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
