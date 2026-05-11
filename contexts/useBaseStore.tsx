import { ProgressNotifyHandle } from '@/components/state/ProgressNotify'
import { create } from 'zustand'

type BaseStore = {
   sessionId: string | null
   progressNotifyRef: React.RefObject<ProgressNotifyHandle | null> | null
}

const useBaseStore = create<BaseStore>(() => ({
   sessionId: null,
   progressNotifyRef: null,
}))

export default useBaseStore
