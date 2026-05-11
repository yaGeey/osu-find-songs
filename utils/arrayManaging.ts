import { BeatmapSet } from '@/types/Osu'

export function chunkArray<T>(arr: T[], chunkSize: number) {
   const res: T[][] = []
   for (let i = 0; i < arr.length; i += chunkSize) {
      res.push(arr.slice(i, i + chunkSize))
   }
   return res
}

export function groupBy<T extends Record<string, any>>(array: Array<T>, key: string) {
   return array.reduce((acc: Record<string, T[]>, item) => {
      if (!acc[item[key]]) {
         acc[item[key]] = []
      }
      acc[item[key]].push(item)
      return acc
   }, {})
}

export function uniqueBeatmapsetMatrix<T extends BeatmapSet>(matrix: T[][]) {
   const seen = new Set<number>()
   const unique: T[][] = []

   for (const arr of matrix) {
      const filteredArr = arr.filter((item) => {
         if (seen.has(item.id)) return false
         seen.add(item.id)
         return true
      })
      if (filteredArr.length) unique.push(filteredArr)
   }
   return unique
}

export function uniqueArray<T>(arr: T[], key: keyof T) {
   const seen = new Set()
   return arr.filter((item) => {
      const duplicate = seen.has(item[key])
      seen.add(item[key])
      return !duplicate
   })
}

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

export function filterMatrix<T>(matrix: T[][], filterFn: (item: T) => boolean) {
   return matrix.map((arr) => arr.filter(filterFn)).filter((arr) => arr.length > 0)
}
