import { getBeatmap, revalidateOsuToken } from '@/lib/osu';
import { cookies } from 'next/headers';
const BATCH_SIZE = 50;

export async function GET(req: Request) {
   const { searchParams } = new URL(req.url);
   const ids = searchParams.getAll('id');

   if (!ids.length || ids.length > BATCH_SIZE)
      return new Response(JSON.stringify({ error: `No IDs provided or more than ${BATCH_SIZE}` }), {
         status: 400,
         headers: { 'Content-Type': 'application/json' },
      });

   let token = (await cookies()).get('osuToken')?.value;
   if (!token) token = await revalidateOsuToken();

   const result = await Promise.all(ids.map((id) => getBeatmap(id, token)));
   const filtered = result.filter(Boolean);
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
      // rating: bs.rating // TODO
      // tags: bs.tags, // TODO implement this
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
   }));

   return new Response(JSON.stringify(simplified), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
   });
}
