import { ProgressNotifyHandle } from '@/components/state/ProgressNotify'
import { create } from 'zustand'

type Pending = {
   filename: string
   downloadedBytes?: number
   totalBytes?: number
}
export const useMapDownloadStore = create<{
   pending: Record<number, Pending>
   add: (id: number, filename: string) => void
   remove: (id: number) => void
   update: (id: number, downloadedBytes: number, totalBytes: number) => void
   progressBlinkRef?: React.RefObject<ProgressNotifyHandle | null>
   setProgressBlinkRef: (ref: React.RefObject<ProgressNotifyHandle | null>) => void
}>((set, get) => ({
   pending: {},

   add: (id, filename) => {
      const { pending } = get()
      if (pending[id]) return
      set({
         pending: {
            ...pending,
            [id]: { filename },
         },
      })
   },
   remove: (id: number) => {
      const { [id]: _, ...rest } = get().pending
      set({ pending: rest })
   },
   update: (id, downloadedBytes, totalBytes) => {
      const { pending } = get()
      if (!pending[id]) return
      set({
         pending: {
            ...pending,
            [id]: {
               ...pending[id],
               downloadedBytes,
               totalBytes,
            },
         },
      })
   },

   progressBlinkRef: undefined,
   setProgressBlinkRef: (ref) => set({ progressBlinkRef: ref }),
}))
