import { NotifyHandle, Message } from '@/components/state/HeaderError'
import { create } from 'zustand'

type NotifyStore = {
   notifyRef: React.RefObject<NotifyHandle | null> | null
   notificationBlink: (state: Message, ms?: number) => void
}

const useNotifyStore = create<NotifyStore>((set, get) => ({
   notifyRef: null,

   // TODO: make it The logger
   // - add detailed console log with detailed info
   // - toasts if cant display text
   notificationBlink: (state, ms) => {
      const ref = get().notifyRef
      if (ref?.current) ref.current.blink(state, ms)
   },
}))
export default useNotifyStore
