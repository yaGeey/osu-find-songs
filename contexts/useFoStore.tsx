import { CombinedSingleSimple } from '@/types/types'
import { create } from 'zustand'
type FoStore = {
   current: CombinedSingleSimple | null
   sortFnName: string
   selectedGroup: string | null
}
const useFoStore = create<FoStore>((set, get) => ({
   current: null,
   sortFnName: 'sort-date',
   selectedGroup: null,
}))
export default useFoStore
