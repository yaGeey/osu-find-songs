import { getBeatmap } from '@/lib/osu'
import { BeatmapSet } from '@/types/Osu'
import axios from 'axios'
const BATCH_SIZE = 50

export async function GET(req: Request) {
   const { searchParams } = new URL(req.url)
   const ids = searchParams.getAll('id')

   if (!ids.length || ids.length > BATCH_SIZE)
      return new Response(JSON.stringify({ error: `No IDs provided or more than ${BATCH_SIZE}` }), {
         status: 400,
         headers: { 'Content-Type': 'application/json' },
      })

   try {
      const results = await Promise.allSettled(ids.map((id) => getBeatmap(id)))
      const successful = results
         .filter((r): r is PromiseFulfilledResult<BeatmapSet> => r.status === 'fulfilled' && r.value !== null)
         .map((r) => r.value)
      const filtered = successful.filter(Boolean)
      const simplified = filtered.map((bs) => ({
         artist: bs.artist,
         covers: bs.covers,
         bpm: bs.bpm,
         creator: bs.creator,
         favourite_count: bs.favourite_count,
         genre: bs.genre,
         id: bs.id,
         last_updated: bs.last_updated,
         play_count: bs.play_count,
         // preview_url: bs.preview_url, // TODO implement this
         source: bs.source,
         status: bs.status,
         ranked: bs.ranked,
         title: bs.title,
         video: bs.video,
         submitted_date: bs.submitted_date,
         // rating: bs.rating
         // tags: bs.tags,
         ranked_date: bs.ranked_date,
         beatmaps: bs.beatmaps.map((b) => ({
            id: b.id,
            version: b.version,
            total_length: b.total_length,
            difficulty_rating: b.difficulty_rating,
            mode: b.mode,
            url: b.url,
            ranked: b.ranked,
            status: b.status,
            accuracy: b.accuracy,
            bpm: b.bpm,
            cs: b.cs,
            ar: b.ar,
            hp: b.drain,
         })),
      }))

      return new Response(JSON.stringify(simplified), {
         status: 200,
         headers: { 'Content-Type': 'application/json' },
      })
   } catch (err) {
      if (axios.isAxiosError(err)) {
         console.error('Axios error in Osu batch processing:', err)
         return new Response(err.response?.data.error ?? err.message ?? 'Unexpected server error', {
            status: err.response?.status || 500,
            headers: { 'Content-Type': 'application/json' },
         })
      }
      console.error('Unknown error in Osu batch processing:', err)
      return new Response('Unknown server error', {
         status: 500,
         headers: { 'Content-Type': 'application/json' },
      })
   }
}
