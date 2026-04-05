import useTimeLeft from '@/hooks/useTimeLeft'
import clientAxios from '@/lib/client-axios'
import { BeatmapSet } from '@/types/Osu'
import { Song } from '@/types/types'
import { useQueries } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

export default function useOsuSearch({ chunks }: { chunks: Song[][] }) {
   const addTimeLeftRef = useRef<(time: number) => void>(() => {})

   const queries = useQueries({
      queries: chunks.map((c) => ({
         queryKey: ['osuChunk', c.map((s) => s.id)],
         queryFn: async () => {
            const t0 = performance.now()
            const res = await clientAxios.get<BeatmapSet[] | null>(`/api/batch/osu`, {
               params: {
                  id: c.map((s) => s.id),
               },
               paramsSerializer: { indexes: null },
               context: 'osu search',
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
