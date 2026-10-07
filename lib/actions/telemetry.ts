'use server'
import { neon } from '@neondatabase/serverless'
import { cacheLife } from 'next/cache'

const isDev = process.env.NODE_ENV === 'development'

// Lazily created so a missing/unreachable DATABASE_URL can't crash the module at import
// time (which would take down any page rendering <BannersContainer/>). See REVIEW.md C7.
let _sql: ReturnType<typeof neon> | null = null
function getSql() {
   if (!_sql) _sql = neon(`${process.env.DATABASE_URL}`)
   return _sql
}

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
   await getSql()`
      INSERT INTO downloads (session_id, map_id, playlist_id, download_all)
      VALUES (${sessionId ?? null}, ${mapId}, ${playlistId}, ${all_value})
   `
}

//* Stats *//
export async function getMapsDownloadedCount() {
   'use cache'
   cacheLife('days')
   try {
      const result = (await getSql()`
         SELECT COUNT(*) AS count
         FROM downloads
      `) as { count: string }[]
      return parseInt(result[0].count, 10)
   } catch {
      return 0
   }
}
export async function getPlaylistsCreatedCount() {
   'use cache'
   cacheLife('days')
   try {
      const result = (await getSql()`
         SELECT COUNT(*) AS count FROM fo_playlists
      `) as { count: string }[]
      return 60 + parseInt(result[0].count, 10)
   } catch {
      return 60
   }
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
   try {
      const results = await getSql()`
         SELECT * FROM banners
         WHERE active = true
         ORDER BY id DESC
      `
      return results as unknown as Banner[]
   } catch {
      return []
   }
}
