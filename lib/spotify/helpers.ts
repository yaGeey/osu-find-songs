import { LocalBeatmap } from '@/types/types'
import { searchTopTracks } from './actions/innerApi'

const conditions = [
   (s: LocalBeatmap) => s,
   (s: LocalBeatmap) => (s.title.includes('(') ? { ...s, title: s.title.replace(/\s*\(.*?\)\s*/g, '').trim() } : null),
   (s: LocalBeatmap) => (s.title.includes('[') ? { ...s, title: s.title.replace(/\s*\[.*?\]\s*/g, '').trim() } : null),
   (s: LocalBeatmap) => (s.artist.match(/feat|ft/i) ? { ...s, author: s.artist.replace(/\s*(feat|ft).*/i, '').trim() } : null),
]

const hardConditions = [(s: LocalBeatmap) => ({ ...s, author: '' })]
const cleanTitle = (title: string) => title.replace('(TV Size)', '').trim()

export const searchSongWithConditions = async (song: LocalBeatmap) => {
   let modifiedSong = { ...song, title: cleanTitle(song.title) }

   for (const condition of conditions) {
      const nextVersion = condition(modifiedSong)
      if (!nextVersion) continue
      else modifiedSong = nextVersion

      const results = await searchTopTracks(`artist:${modifiedSong.artist} track:${modifiedSong.title}`.trim())
      if (results.length) return results
      await new Promise((r) => setTimeout(r, Math.random() * 30 + 150))
   }

   for (const condition of hardConditions) {
      const hardSearch = condition(modifiedSong)

      const results = await searchTopTracks(`title:${hardSearch.title}`)
      if (results.length) return results
   }
   return null
}
