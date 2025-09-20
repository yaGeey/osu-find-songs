'use server'
import { neon } from '@neondatabase/serverless'
export async function sendMapDownloadTelemetry({
   sessionId,
   mapId,
   playlistId,
}: {
   sessionId: string
   mapId: string
   playlistId: string
}) {
   const sql = neon(`${process.env.DATABASE_URL}`)
   await sql`
      INSERT INTO downloads (session_id, map_id, playlist_id)
      VALUES (${sessionId}, ${mapId}, ${playlistId})
   `
}
