import { NotifyHandle, Message } from '@/components/state/HeaderError'
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
   notifyRef: React.RefObject<NotifyHandle | null> | null
   notificationBlink: (state: Message, ms?: number) => void
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

   notifyRef: null,

   // TODO: make it The logger
   // - add detailed console log with detailed info
   // - toasts if cant display text
   notificationBlink: (state, ms) => {
      const ref = get().notifyRef
      if (ref?.current) ref.current.blink(state, ms)
   },
}))
export default useBaseStore
