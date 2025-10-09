import { ProgressNotifyHandle } from '@/components/state/ProgressNotify'
import { create } from 'zustand'

export const useMapDownloadStore = create<{
   pending: number[]
   add: (id: number) => void
   remove: (id: number) => void
   progressBlinkRef?: React.RefObject<ProgressNotifyHandle | null>
   setProgressBlinkRef: (ref: React.RefObject<ProgressNotifyHandle | null>) => void
}>((set, get) => ({
   pending: [],
   add: (id: number) => {
      const { pending } = get()
      if (!pending.includes(id)) set({ pending: [...pending, id] })
   },
   remove: (id: number) => {
      const { pending } = get()
      set({ pending: pending.filter((i) => i !== id) })
   },
   progressBlinkRef: undefined,
   setProgressBlinkRef: (ref) => set({ progressBlinkRef: ref }),
}))
