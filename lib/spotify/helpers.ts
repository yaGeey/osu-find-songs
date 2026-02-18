import { Song } from '@/types/types'
import { searchTopTracks } from './innerApi'

const conditions = [
   (s: Song) => s,
   (s: Song) => (s.title.includes('(') ? { ...s, title: s.title.replace(/\s*\(.*?\)\s*/g, '').trim() } : null),
   (s: Song) => (s.title.includes('[') ? { ...s, title: s.title.replace(/\s*\[.*?\]\s*/g, '').trim() } : null),
   (s: Song) => (s.author.match(/feat|ft/i) ? { ...s, author: s.author.replace(/\s*(feat|ft).*/i, '').trim() } : null),
]

const hardConditions = [(s: Song) => ({ ...s, author: '' })]
const cleanTitle = (title: string) => title.replace('(TV Size)', '').trim()

export const searchSongWithConditions = async (song: Song) => {
   let modifiedSong = { ...song, title: cleanTitle(song.title) }

   for (const condition of conditions) {
      const nextVersion = condition(modifiedSong)
      if (!nextVersion) continue
      else modifiedSong = nextVersion

      const results = await searchTopTracks(`artist:${modifiedSong.author} track:${modifiedSong.title}`.trim())
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
