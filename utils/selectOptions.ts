const sortOptionValues = ['bpm', 'newest', 'rating'] as const
export type SortOptionValue = (typeof sortOptionValues)[number]
export const sortOptions: { value: SortOptionValue; label: string[] }[] = [
   { value: 'bpm', label: ['bpm'] },
   { value: 'newest', label: ['newest'] },
   { value: 'rating', label: ['rating'] },
]

const groupOptionValues = ['artist', 'bpm', 'genre', 'language', 'year'] as const
export type GroupOptionValue = (typeof groupOptionValues)[number]
export const groupOptions: { value: GroupOptionValue; label: string[] }[] = [
   { value: 'artist', label: ['artist'] },
   { value: 'bpm', label: ['bpm', 'beats per minute'] },
   { value: 'genre', label: ['genre'] },
   { value: 'language', label: ['language'] },
   { value: 'year', label: ['year'] },
]

export const filterOptions = [{ value: 'exact-spotify', label: 'Exact Spotify match' }]

export const languageOptions = [
   { value: 'en', label: 'English' },
   { value: 'ru', label: 'Русский' },
   { value: 'uk', label: 'Українська' },
]
