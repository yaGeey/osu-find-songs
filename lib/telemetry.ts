'use server'
import { neon } from '@neondatabase/serverless'
const sql = neon(`${process.env.DATABASE_URL}`)

export async function sendMapDownloadTelemetry({
   sessionId,
   mapId,
   playlistId,
   all,
}: {
   sessionId: string
   mapId: number
   playlistId: string
   all?: boolean
}) {
   const all_value = all ?? false
   await sql`
      INSERT INTO downloads (session_id, map_id, playlist_id, download_all)
      VALUES (${sessionId}, ${mapId}, ${playlistId}, ${all_value})
   `
}

//* Fo Telemetry *//

export async function foTelemetryStart(mapsAmount: number, sessionId?: string) {
   const result = await sql`
      INSERT INTO fo_loading (session_id, maps_amount)
      VALUES (${sessionId}, ${mapsAmount})
      RETURNING id
   `
   return result[0].id as number
}
export async function foTelemetryFinishedSpotify(id: number) {
   await sql`
      UPDATE fo_loading
      SET spotify_finish_at = NOW()
      WHERE id = ${id}
   `
}
export async function foTelemetryFinishedOsu(id: number) {
   await sql`
      UPDATE fo_loading
      SET osu_finish_at = NOW()
      WHERE id = ${id}
   `
}
export async function foTelemetryError(id: number, errorMessage: string) {
   await sql`
      UPDATE fo_loading
      SET error = ${errorMessage}, finish_at = NOW()
      WHERE id = ${id}
   `
}
