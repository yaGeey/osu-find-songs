import { getBeatmap } from '@/lib/osu'
import { BeatmapSet } from '@/types/Osu'
import axios from 'axios'
export const revalidate = 0;

export async function GET(req: Request) {
   const { searchParams } = new URL(req.url)
   const ids = searchParams.getAll('id')

   const promises = await Promise.allSettled(ids.map((id) => getBeatmap(id)))
   const results = promises.map((r) => (r.status === 'fulfilled' && r.value ? r.value : null))

   const simplified = results.map((bs) => {
      if (!bs) return null
      return {
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
      }
   })

   return new Response(JSON.stringify(simplified), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   })
}
