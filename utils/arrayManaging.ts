import { BeatmapSet, BeatmapSetFromOsu } from '@/types/Osu'
import { CombinedQueried, CombinedSingleSimple } from '@/types/types'
import { GroupOptionValue, SortOptionValue } from './selectOptions'

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
      a.local.artist?.toLowerCase().includes(str) ||
      a.local.creator?.toLowerCase().includes(str)
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

export const getGroupedArray = (groupFn: GroupOptionValue | null, combinedArray: CombinedSingleSimple[]) => {
   switch (groupFn) {
      case 'year':
         return Object.groupBy(combinedArray, (q) => q.osu?.submitted_date?.split('-')[0] ?? 'Unknown')
      case 'genre':
         return Object.groupBy(combinedArray, (q) => q.osu?.genre ?? 'Unknown')
      case 'bpm':
         return Object.groupBy(combinedArray, (q) => {
            if (!q.osu) return 'Unknown'
            const bpm = q.osu.bpm
            if (bpm < 100) return '< 100 bpm'
            if (bpm < 200) return '100 - 200 bpm'
            if (bpm < 300) return '200 - 300 bpm'
            return '> 300 bpm'
         })
      case 'artist':
         return Object.groupBy(combinedArray, (q) => q.local.artist ?? 'Unknown')
      case 'language':
         return Object.groupBy(combinedArray, (q) => q.osu?.language ?? 'Unknown')
      case null:
         return { '': combinedArray }
      default:
         throw new Error(`Unknown group function: ${groupFn satisfies never}`)
   }
}

const sortBeatmaps = (sortFn: SortOptionValue | null, a: BeatmapSetFromOsu | null, b: BeatmapSetFromOsu | null) => {
   if (!a || !b) return 0
   switch (sortFn) {
      case 'bpm':
         return a.bpm - b.bpm
      case 'newest':
         return new Date(a.submitted_date).getTime() - new Date(b.submitted_date).getTime()
      case 'rating':
         return a.rating - b.rating
      case null:
         return 0
      default:
         throw new Error(`Unknown sort function: ${sortFn satisfies never}`)
   }
}

export function sortGroupedArray(
   sortFn: SortOptionValue | null,
   sortOrder: 'asc' | 'desc',
   groupedArray: ReturnType<typeof getGroupedArray>,
) {
   return Object.fromEntries(
      Object.entries(groupedArray).map(([key, value]) => {
         const sortedArray = value.toSorted((a, b) => {
            const comparison = sortBeatmaps(sortFn, a.osu, b.osu)
            return comparison * (sortOrder === 'asc' ? 1 : -1)
         })
         return [key, sortedArray]
      }),
   )
}

// TODO розберись, це чат гпт
export function mergeGroupedArrays<T>(grouped: Record<string, any[]>[]) {
   return grouped.reduce(
      (acc, obj) => {
         for (const [key, value] of Object.entries(obj)) {
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
