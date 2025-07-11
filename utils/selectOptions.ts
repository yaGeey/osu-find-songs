import { CSSObject } from '@emotion/react'

export const sortOptions = [
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

export const groupOptions = [
   { value: 'no', label: 'No Grouping' },
   // { value: 'artist', label: 'By Artist' },
   { value: 'bpm', label: 'By BPM' },
   // { value: 'creator', label: 'By Creator' },
   // { value: 'date', label: 'By Date Downloaded' },
   // { value: 'dif', label: 'By Difficulty' },
   { value: 'genre', label: 'By Genre' },
   { value: 'length', label: 'By Length' },
   // { value: 'title', label: 'By Title' },
   { value: 'year', label: 'By Year' },
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
