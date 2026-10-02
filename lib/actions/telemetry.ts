'use server'
import { neon } from '@neondatabase/serverless'
import { cacheLife } from 'next/cache'
const sql = neon(`${process.env.DATABASE_URL}`)
const isDev = process.env.NODE_ENV === 'development'

export async function sendMapDownloadTelemetry({
   sessionId,
   mapId,
   playlistId,
   all,
}: {
   sessionId?: string
   mapId: number
   playlistId: string
   all?: boolean
}) {
   if (isDev) return
   const all_value = all ?? false
   await sql`
      INSERT INTO downloads (session_id, map_id, playlist_id, download_all)
      VALUES (${sessionId ?? null}, ${mapId}, ${playlistId}, ${all_value})
   `
}

//* Stats *//
export async function getMapsDownloadedCount() {
   'use cache'
   cacheLife('days')
   const result = await sql`
      SELECT COUNT(*) AS count
      FROM downloads
   `
   return parseInt(result[0].count, 10)
}
export async function getPlaylistsCreatedCount() {
   'use cache'
   cacheLife('days')
   const result = await sql`
      SELECT COUNT(*) AS count FROM fo_playlists
   `
   return 60 + parseInt(result[0].count, 10)
}

//* Not a Telemetry *//
export type Banner = {
   id: number
   content: string
   active: boolean
   closable: boolean
   show_on_visit?: number
   show_on_page?: string
   created_at: Date
}
export async function getActiveBanners() {
   'use cache'
   cacheLife('hours')
   const results = await sql`
      SELECT * FROM banners
      WHERE active = true
      ORDER BY id DESC
   `
   return results as unknown as Banner[]
}
