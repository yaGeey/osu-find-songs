import { searchSongWithConditions } from '@/lib/spotify/helpers'
import { SpotifyTrackFromOsu } from '@/types/graphql-spotify/searchDesktop'
import { LocalBeatmap } from '@/types/types'
import { MAX_SPOTIFY_SEARCH_CONCURRENCY, OSU_BATCH_SIZE } from '@/variables'
import pLimit from 'p-limit'
// TODO maybe remove pLimit or make it conccurent to emulate user?
const limit = pLimit(MAX_SPOTIFY_SEARCH_CONCURRENCY)

export type ServerSpotifyResponse = (number[] | null)[]

export async function POST(req: Request) {
   const songs: LocalBeatmap[] = await req.json()

   if (!songs.length || songs.length > OSU_BATCH_SIZE)
      return new Response(`No songs provided or more than ${OSU_BATCH_SIZE}`, {
         status: 400,
      })

   //TODO implement reject reason handle
   //? we are not using RateLimitManager as it's interal API, there is no restrictions
   const tasks = songs.map((song) => limit(() => searchSongWithConditions(song).catch((err) => null)))
   const res = await Promise.all(tasks)

   return new Response(
      // FIXME satisfies ServerSpotifyResponse
      JSON.stringify(res.map((tracks) => (tracks ? tracks.map((t) => t.id) : null)) as ServerSpotifyResponse),
      {
         status: 200,
         headers: { 'Content-Type': 'application/json' },
      },
   )
}
