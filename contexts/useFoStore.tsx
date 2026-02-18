import { CombinedSingleSimple } from '@/types/types'
import { create } from 'zustand'
type FoStore = {
   current: CombinedSingleSimple | null
   sortFnName: string
   selectedGroup: string | null
   showSpotifyEmbeds: boolean
   setSpotifyEmbeds: (value: boolean) => void
}
function getLocalStorageBoolean(key: string, defaultValue: boolean): boolean {
   if (typeof window === 'undefined') return defaultValue
   const item = localStorage.getItem(key)
   if (item === null) return defaultValue
   return item === 'true'
}
const useFoStore = create<FoStore>((set, get) => ({
   current: null,
   sortFnName: 'sort-date',
   selectedGroup: null,
   showSpotifyEmbeds: getLocalStorageBoolean('showSpotifyEmbeds', true),
   setSpotifyEmbeds: (value: boolean) => {
      localStorage.setItem('showSpotifyEmbeds', value.toString())
      set({ showSpotifyEmbeds: value })
   },
}))
export default useFoStore
