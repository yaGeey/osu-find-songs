export type FilterOption = {
   label: string[]
   value: string
   isNested?: boolean
   isDate?: boolean
}
export type Filter = '<' | '=' | '>' | ''
export type SelectedOption = { option: FilterOption; filter: Filter; value: number | string }

export const options: FilterOption[] = [
   { label: ['star rating', 'sr', 'difficulty'], value: 'difficulty_rating', isNested: true },
   { label: ['ar', 'circle approach rate'], value: 'ar', isNested: true },
   { label: ['bpm', 'beats per minute'], value: 'bpm' },
   { label: ['length'], value: 'total_length', isNested: true },
   { label: ['accuracy'], value: 'accuracy', isNested: true },
   { label: ['cs', 'circle size'], value: 'cs', isNested: true },
   { label: ['drain'], value: 'drain', isNested: true },
   // { label: ['max combo'], value: 'max_combo', isNested: true },
   { label: ['plays'], value: 'play_count' },
   { label: ['favourites'], value: 'favourite_count' },
   { label: ['rating'], value: 'rating' },
   { label: ['last updated date'], value: 'last_updated', isDate: true },
   { label: ['ranked date'], value: 'ranked_date', isDate: true },
   { label: ['submitted date'], value: 'submitted_date', isDate: true },
]
