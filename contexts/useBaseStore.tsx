import { ProgressNotifyHandle } from '@/components/state/ProgressNotify'
import { CombinedSingleSimple } from '@/types/types'
import { SortOptionValue } from '@/utils/selectOptions'
import { create } from 'zustand'

type FoStore = {
   current: CombinedSingleSimple | null
   sortFnName: SortOptionValue | null
   selectedGroup: string | null
   showSpotifyEmbeds: boolean
   setSpotifyEmbeds: (value: boolean) => void
   sessionId: string | null
   progressNotifyRef: React.RefObject<ProgressNotifyHandle | null> | null
}

function getLocalStorageBoolean(key: string, defaultValue: boolean): boolean {
   if (typeof window === 'undefined') return defaultValue
   const item = localStorage.getItem(key)
   if (item === null) return defaultValue
   return item === 'true'
}

const useBaseStore = create<FoStore>((set, get) => ({
   current: null,
   sortFnName: null,
   selectedGroup: null,
   showSpotifyEmbeds: getLocalStorageBoolean('showSpotifyEmbeds', true),
   setSpotifyEmbeds: (value: boolean) => {
      localStorage.setItem('showSpotifyEmbeds', value.toString())
      set({ showSpotifyEmbeds: value })
   },
   sessionId: null,

   progressNotifyRef: null,
}))
export default useBaseStore
