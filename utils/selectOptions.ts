const sortOptionValues = ['artist', 'bpm', 'creator', 'date-updated', 'length', 'title'] as const
export type SortOptionValue = (typeof sortOptionValues)[number]
export const sortOptions: { value: SortOptionValue; label: string[] }[] = [
   { value: 'artist', label: ['artist'] },
   { value: 'bpm', label: ['bpm'] },
   { value: 'creator', label: ['creator'] },
   { value: 'date-updated', label: ['date updated'] },
   { value: 'length', label: ['length'] },
   { value: 'title', label: ['title'] },
]

const groupOptionValues = ['bpm', 'genre', 'length', 'year'] as const
export type GroupOptionValue = (typeof groupOptionValues)[number]
export const groupOptions: { value: GroupOptionValue; label: string[] }[] = [
   { value: 'bpm', label: ['bpm'] },
   { value: 'genre', label: ['genre'] },
   { value: 'length', label: ['length'] },
   { value: 'year', label: ['year'] },
]

export const filterOptions = [{ value: 'exact-spotify', label: 'Exact Spotify match' }]

export const languageOptions = [
   { value: 'en', label: 'English' },
   { value: 'ru', label: 'Русский' },
   { value: 'uk', label: 'Українська' },
]
