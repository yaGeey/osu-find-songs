'use client';
import { Song } from '@/types/types';
import { createContext, useContext, useState } from 'react';

type SongsContextType = {
   songs: Song[];
   setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
};
const SongsContext = createContext<SongsContextType | null>(null);

export function SongContextProvider({ children }: { children: React.ReactNode }) {
   const [songs, setSongs] = useState<Song[]>([]);
   return <SongsContext.Provider value={{ songs, setSongs }}>{children}</SongsContext.Provider>;
}

export function useSongContext() {
   const context = useContext(SongsContext);
   if (!context) {
      throw new Error('useSongContext must be used within a SongContextProvider');
   }
   return context;
}
