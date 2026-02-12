import { BeatmapSet } from '@/types/Osu'
import { Track } from '@/types/Spotify'
import { Combined, CombinedQueried, CombinedSingle, CombinedSingleSimple, Song, SongDataQueried } from '@/types/types'

// filters
export const filterFn = (exactSpotify: boolean) => (a: CombinedSingleSimple) => {
   if (!exactSpotify) return true

   if (!a.spotify) return false
   return a.spotify.length !== 20
}

export const searchFilterFn = (search: string) => (a: CombinedSingleSimple) => {
   if (!search.length || !a.osu) return true
   const str = search.toLowerCase()
   return (
      a.local.title?.toLowerCase().includes(str) ||
      a.local.author?.toLowerCase().includes(str) ||
      a.osu.creator?.toLowerCase().includes(str)
   )
}

// chunk array
export function chunkArray<T>(arr: T[], chunkSize: number) {
   const res: T[][] = []
   for (let i = 0; i < arr.length; i += chunkSize) {
      res.push(arr.slice(i, i + chunkSize))
   }
   return res
}

// simple group
export function groupBy<T extends Record<string, any>>(array: Array<T>, key: string) {
   return array.reduce((acc: Record<string, T[]>, item) => {
      if (!acc[item[key]]) {
         acc[item[key]] = []
      }
      acc[item[key]].push(item)
      return acc
   }, {})
}

// unique beatmapset
export function uniqueBeatmapsetMatrix(m: BeatmapSet[][]) {
   const seen = new Set()
   const unique: BeatmapSet[][] = []

   for (const arr of m) {
      const filteredArr = arr.filter((item) => {
         if (seen.has(item.id)) return false
         seen.add(item.id)
         return true
      })
      if (filteredArr.length) unique.push(filteredArr)
   }
   return unique
}

// unique
export function uniqueArray<T>(arr: T[], key: keyof T) {
   const seen = new Set()
   return arr.filter((item) => {
      const duplicate = seen.has(item[key])
      seen.add(item[key])
      return !duplicate
   })
}

export function flatCombinedArray(arr: CombinedQueried): CombinedSingleSimple[] {
   return arr.local.map((item, i) => ({
      local: item,
      spotify: arr.spotifyQuery.data?.[i] ?? null,
      osu: arr.osuQuery.data?.[i] ?? null,
      isSpotifyLoading: arr.spotifyQuery.isLoading,
      isOsuLoading: arr.osuQuery.isLoading,
      error: arr.spotifyQuery.error?.message ?? arr.osuQuery.error?.message ?? null,
   }))
}

// group
export function groupArray(groupFn: string, sortOrder: string, sortFn: string, combinedArray: CombinedSingleSimple[]) {
   let groupedArray

   // Grouping
   // TODO sort grouping titles UI
   if (groupFn === 'year') {
      groupedArray = Object.groupBy(combinedArray, (q) => q.osu?.submitted_date?.split('-')[0] ?? 'Unknown')
   } else if (groupFn === 'genre') {
      groupedArray = Object.groupBy(combinedArray, (q) => q.osu?.genre.name ?? 'Unknown')
   } else if (groupFn === 'length') {
      groupedArray = Object.groupBy(combinedArray, (q) => {
         if (!q.osu) return 'Unknown'
         const length = q.osu.beatmaps[0].total_length
         if (length < 60) return '< 1 minute'
         if (length < 120) return '1 - 2 minutes'
         if (length < 300) return '2 - 5 minutes'
         if (length < 600) return '5 - 10 minutes'
         return '> 10 minutes'
      })
   } else if (groupFn === 'artist') {
      groupedArray = Object.groupBy(combinedArray, (q) => q.osu?.artist ?? 'Unknown')
   } else if (groupFn === 'bpm') {
      groupedArray = Object.groupBy(combinedArray, (q) => {
         if (!q.osu) return 'Unknown'
         const bpm = q.osu.bpm
         if (bpm < 100) return '< 100 bpm'
         if (bpm < 200) return '100 - 200 bpm'
         if (bpm < 300) return '200 - 300 bpm'
         return '> 300 bpm'
      })
   } else if (groupFn === 'no') {
      groupedArray = { '': combinedArray }
   } else {
      groupedArray = { '': combinedArray }
   }

   // Sort each group
   // TODO розберись, перепиши мб
   const sortedGroupedArray = Object.entries(groupedArray).reduce(
      (acc, [key, value]) => {
         const sortedArray = value.sort((a, b) => {
            const aData = sortOrder == 'asc' ? a.osu : b.osu
            const bData = sortOrder == 'asc' ? b.osu : a.osu
            if (!aData || !bData) return 0

            switch (sortFn) {
               case 'sort-artist':
                  return aData.artist.localeCompare(bData.artist)
               case 'sort-bpm':
                  return aData.bpm - bData.bpm
               case 'sort-creator':
                  return aData.creator.localeCompare(bData.creator)
               case 'sort-date':
                  return 0
               case 'sort-date-mapped':
                  return new Date(aData.submitted_date).getTime() - new Date(bData.submitted_date).getTime()
               case 'sort-date-updated':
                  return new Date(aData.last_updated).getTime() - new Date(bData.last_updated).getTime()
               // case 'sort-dif': return aData.difficulty - bData.difficulty;
               case 'sort-length':
                  return aData.beatmaps[0].total_length - bData.beatmaps[0].total_length
               case 'sort-title':
                  return aData.title.localeCompare(bData.title)
               default:
                  return 0
            }
         })

         acc[key] = sortedArray
         return acc
      },
      {} as Record<string, typeof combinedArray>,
   )

   return sortedGroupedArray
}

// TODO розберись, це чат гпт
export function mergeGroupedArrays<T>(grouped: Record<string, any[]>[]) {
   return grouped.reduce(
      (acc, obj) => {
         for (const [key, value] of Object.entries(obj)) {
            // ❌ НЕБЕЗПЕЧНО: Spread operator на великих масивах
            // acc[key] = [...(acc[key] || []), ...(value || [])]
            // ✅ БЕЗПЕЧНО: Використання concat (створює новий масив, не використовуючи стек)
            acc[key] = (acc[key] || []).concat(value || [])
         }
         return acc
      },
      {} as Record<string, T[]>,
   )
}

// filter matrix
export function filterMatrix<T>(matrix: T[][], filterFn: (item: T) => boolean) {
   return matrix.map((arr) => arr.filter(filterFn)).filter((arr) => arr.length > 0)
}
