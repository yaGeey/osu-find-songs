import useTimeLeft from '@/hooks/useTimeLeft'
import clientAxios from '@/lib/clientAxios'
import { SpotifyTrack } from '@/types/graphql-spotify/searchDesktop'
import { Song } from '@/types/types'
import { MAX_SPOTIFY_SEARCH_CONCURRENCY } from '@/variables'
import { useQueries } from '@tanstack/react-query'
import pLimit from 'p-limit'
import { useEffect, useRef } from 'react'
const limit = pLimit(MAX_SPOTIFY_SEARCH_CONCURRENCY)

export default function useSpotifySearch({ chunks }: { chunks: Song[][] }) {
   const addTimeLeftRef = useRef<(time: number) => void>(() => {})

   const queries = useQueries({
      queries: chunks.map((c) => ({
         queryKey: ['spotifyChunk', c.map((s) => s.id)],
         queryFn: async () => {
            const t0 = performance.now()
            const res = await limit(() =>
               clientAxios.post<(SpotifyTrack[] | null)[]>('/api/batch/spotify', c, {
                  context: 'spotify search',
                  ignoredErrors: [504],
               }),
            )
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

   return { isFetching, queries, timeLeft, msLeft }
}
