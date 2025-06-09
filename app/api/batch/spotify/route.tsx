import {
  revalidateSpotifyToken,
  searchSongWithConditions,
} from "@/lib/Spotify";
import { Song } from "@/types/types";
import { cookies } from "next/headers";
const BATCH_SIZE = 50;

export async function POST(req: Request) {
  const songs: Song[] = await req.json();

  if (!songs.length || songs.length > BATCH_SIZE)
    return new Response(
      JSON.stringify({ error: `No songs provided or more than ${BATCH_SIZE}` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );

  let token = (await cookies()).get("spotifyToken")?.value;
  if (!token) token = await revalidateSpotifyToken();

  const result = await Promise.all(
    songs.map((song) => searchSongWithConditions(song, token)),
  );
  const filtered = result.filter(Boolean);
  // TODO: Simplify the result clear and remove unnecessary fields

  return new Response(JSON.stringify(filtered), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
