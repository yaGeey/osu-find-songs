import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AppState = {
   isOsuDlModalSeen: boolean
}

const initialState: AppState = {
   isOsuDlModalSeen: false,
}

export default create<AppState>()(
   persist(() => initialState, {
      name: 'app-state',
   }),
)
