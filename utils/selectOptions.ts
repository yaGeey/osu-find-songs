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

const groupOptionValues = ['artist', 'bpm', 'genre', 'length', 'year'] as const
export type GroupOptionValue = (typeof groupOptionValues)[number]
export const groupOptions: { value: GroupOptionValue; label: string[] }[] = [
   { value: 'artist', label: ['artist'] },
   { value: 'genre', label: ['genre'] },
   { value: 'year', label: ['year'] },
   { value: 'bpm', label: ['bpm', 'beats per minute'] },
   { value: 'length', label: ['length'] },
]

export const filterOptions = [{ value: 'exact-spotify', label: 'Exact Spotify match' }]

export const languageOptions = [
   { value: 'en', label: 'English' },
   { value: 'ru', label: 'Русский' },
   { value: 'uk', label: 'Українська' },
]
