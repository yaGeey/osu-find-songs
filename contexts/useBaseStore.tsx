import { NotifyHandle, Message } from '@/components/state/HeaderError'
import { CombinedSingleSimple } from '@/types/types'
import { SortOptionValue } from '@/utils/selectOptions'
import { create } from 'zustand'

type FoStore = {
   current: CombinedSingleSimple | null
   sortFnName: SortOptionValue | null
   selectedGroup: string | null
   sessionId: string | null
   notifyRef: React.RefObject<NotifyHandle | null> | null
   notificationBlink: (state: Message, ms?: number) => void
}

const useBaseStore = create<FoStore>((set, get) => ({
   current: null,
   sortFnName: null,
   selectedGroup: null,
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
