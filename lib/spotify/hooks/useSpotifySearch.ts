import useTimeLeft from '@/hooks/useTimeLeft'
import clientAxios from '@/lib/client-axios'
import { SpotifyTrack } from '@/types/graphql-spotify/searchDesktop'
import { BeatmapSet } from '@/types/Osu'
import { Song } from '@/types/types'
import { useQueries } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

export default function useSpotifySearch({ chunks }: { chunks: Song[][] }) {
   const addTimeLeftRef = useRef<(time: number) => void>(() => {})

   const queries = useQueries({
      queries: chunks.map((c) => ({
         queryKey: ['spotifyChunk', c.map((s) => s.id)],
         queryFn: async () => {
            const t0 = performance.now()
            const res = await clientAxios.post<(SpotifyTrack[] | null)[]>('/api/batch/spotify', c, {
               context: 'spotify search',
            })
            addTimeLeftRef.current(performance.now() - t0)
            return res.data
         },
         retry: false,
      })),
   })

   const { addTimeLeft, timeLeft, msLeft } = useTimeLeft(queries.filter((q) => !q.isFetched).length)
   useEffect(() => {
      addTimeLeftRef.current = addTimeLeft
   }, [addTimeLeft])

   const isFetching = queries.some((q) => q.isFetching)
   // const data = queries.map((q) => q.data).filter((d): d is BeatmapSet[] => !!d)

   return { isFetching, queries, timeLeft, msLeft }
}
