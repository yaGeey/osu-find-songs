import { searchSongWithConditions } from '@/lib/Spotify'
import { SpotifyError, Track, TrackFull } from '@/types/Spotify'
import { Song } from '@/types/types'
import axios from 'axios'
const BATCH_SIZE = 50

export async function POST(req: Request) {
   const songs: Song[] = await req.json()

   if (!songs.length || songs.length > BATCH_SIZE)
      return new Response(`No songs provided or more than ${BATCH_SIZE}`, {
         status: 400,
      })

   // TODO implement reject reason handle
   const promises = await Promise.allSettled(songs.map((song) => searchSongWithConditions(song))) //? returns { status: 'fulfilled' | 'rejected', value?: T, reason?: any }
   const results = promises.map((r) =>
      r.status === 'fulfilled' && r.value !== null && r.value !== undefined && Array.isArray(r.value) && r.value.length > 0
         ? r.value
         : null,
   )

   const simplified: (Track[] | undefined)[] = results.map((batch) =>
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
