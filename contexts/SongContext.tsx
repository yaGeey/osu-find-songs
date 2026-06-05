'use client'
import { LocalBeatmap } from '@/types/types'
import { createContext, useContext, useState } from 'react'

type LocalBeatmapsContextType = {
   localBeatmaps: LocalBeatmap[]
   setLocalBeatmaps: React.Dispatch<React.SetStateAction<LocalBeatmap[]>>
}
const LocalBeatmapsContext = createContext<LocalBeatmapsContextType | null>(null)

export function LocalBeatmapsContextProvider({ children }: { children: React.ReactNode }) {
   const [songs, setSongs] = useState<LocalBeatmap[]>([])
   return (
      <LocalBeatmapsContext.Provider value={{ localBeatmaps: songs, setLocalBeatmaps: setSongs }}>
         {children}
      </LocalBeatmapsContext.Provider>
   )
}

export function useLocalBeatmapsContext() {
   const context = useContext(LocalBeatmapsContext)
   if (!context) {
      throw new Error('useSongContext must be used within a SongContextProvider')
   }
   return context
}
