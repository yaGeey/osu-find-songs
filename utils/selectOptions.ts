import { CSSObject } from '@emotion/react'

export const _sortOptions = [
   { value: 'sort-date', label: 'Default' },
   { value: 'sort-artist', label: 'By Artist' },
   { value: 'sort-bpm', label: 'By BPM' },
   { value: 'sort-creator', label: 'By Creator' },
   // { value: 'sort-date-mapped', label: 'By Date Mapped' },
   { value: 'sort-date-updated', label: 'By Date Updated' },
   // { value: 'sort-dif', label: 'By Difficulty' },
   { value: 'sort-length', label: 'By Length' },
   { value: 'sort-title', label: 'By Title' },
]
export const sortOptions = [
   { value: 'sort-date', label: ['date'] },
   { value: 'sort-artist', label: ['artist'] },
   { value: 'sort-bpm', label: ['bpm'] },
   { value: 'sort-creator', label: ['creator'] },
   { value: 'sort-date-updated', label: ['date updated'] },
   { value: 'sort-length', label: ['length'] },
   { value: 'sort-title', label: ['title'] },
]

export const _groupOptions = [
   // { value: 'artist', label: 'By Artist' },
   { value: 'bpm', label: 'bpm' },
   // { value: 'creator', label: 'By Creator' },
   // { value: 'date', label: 'By Date Downloaded' },
   // { value: 'dif', label: 'By Difficulty' },
   { value: 'genre', label: 'genre' },
   { value: 'length', label: 'length' },
   // { value: 'title', label: 'By Title' },
   { value: 'year', label: 'year' },
]
export const groupOptions = [
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

export const selectStyles = {
   control: (base: CSSObject) => ({
      ...base,
      height: 35,
      minHeight: 35,
      fontSize: '14px',
      borderRadius: '8px',
   }),
   menu: (base: CSSObject) => ({
      ...base,
      fontSize: '14px',
   }),
}
