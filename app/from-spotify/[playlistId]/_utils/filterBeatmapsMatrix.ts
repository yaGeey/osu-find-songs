import { Beatmap, type BeatmapSet } from '@/types/Osu'
import { filterMatrix } from '@/utils/arrayManaging'
import { Filter, SelectedOption } from '@/components/selectors/FilterOptions'
// TODO розберись, це чат гпт
export function filterBeatmapsMatrix(m: BeatmapSet[][], filters: SelectedOption[]) {
   if (!filters.length) return m
   return filterMatrix(m, (set) => {
      return filters.every(({ option, filter, value }) => {
         if (option.isNested) {
            return set.beatmaps.some((map) => {
               const field = map[option.value as keyof Beatmap]
               return checkFilterCondition(field, filter, value, option.isDate)
            })
         }

         const field = set[option.value as keyof BeatmapSet]
         return checkFilterCondition(field, filter, value, option.isDate)
      })
   })
}

function checkFilterCondition(field: any, filter: Filter, value: string | number, isDate?: boolean): boolean {
   if (field === undefined || field === null) return false

   // Exclude unsupported types early (booleans, objects, arrays, etc.)
   if (typeof field === 'boolean') return false
   if (typeof field === 'object') return false

   // At this point field is expected to be string or number
   let fieldValue: number | string = field as number | string

   if (typeof fieldValue === 'string' && isDate) {
      fieldValue = parseFloat(fieldValue)
      if (isNaN(fieldValue)) return false
   }

   if (isDate) {
      const dateValue = new Date(value as string).getTime()
      const fieldDateValue = new Date(fieldValue as string).getTime()
      switch (filter) {
         case '<':
            return fieldDateValue < dateValue
         case '=':
            return fieldDateValue === dateValue
         case '>':
            return fieldDateValue > dateValue
         default:
            return false
      }
   } else {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(numericValue as number)) return false
      switch (filter) {
         case '<':
            return (fieldValue as number) < (numericValue as number)
         case '=':
            return (fieldValue as number) === (numericValue as number)
         case '>':
            return (fieldValue as number) > (numericValue as number)
         default:
            return false
      }
   }
}
