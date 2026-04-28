import useTimeLeft from '@/hooks/useTimeLeft'
import clientAxios from '@/lib/clientAxios'
import { BeatmapSet } from '@/types/Osu'
import { Song } from '@/types/types'
import { MAX_OSU_SEARCH_CONCURRENCY } from '@/variables'
import { useQueries } from '@tanstack/react-query'
import pLimit from 'p-limit'
import { useEffect, useRef } from 'react'
const limit = pLimit(MAX_OSU_SEARCH_CONCURRENCY)

export default function useOsuSearch({ chunks }: { chunks: Song[][] }) {
   const addTimeLeftRef = useRef<(time: number) => void>(() => {})

   const queries = useQueries({
      queries: chunks.map((c) => ({
         queryKey: ['osuChunk', c.map((s) => s.id)],
         queryFn: async () => {
            const t0 = performance.now()
            const res = await limit(() =>
               clientAxios.get<BeatmapSet[] | null>(`/api/batch/osu`, {
                  params: {
                     id: c.map((s) => s.id),
                  },
                  paramsSerializer: { indexes: null },
                  context: 'osu search',
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
   // const data = queries.map((q) => q.data).filter((d): d is BeatmapSet[] => !!d)

   return { isFetching, queries, timeLeft, msLeft }
}
