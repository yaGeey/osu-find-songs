import { useQuery } from '@tanstack/react-query'
import { getPrioritizedMirrorsFilteredByDead } from '../osuMirrors'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import { useEffect } from 'react'

export default function usePrepareMirrors() {
   const query = useQuery({
      queryKey: ['osuMirrors'],
      queryFn: async () => {
         const mirrors = await getPrioritizedMirrorsFilteredByDead()
         if (mirrors.length === 0 || !mirrors) {
            throw new Error('No map download sources available at the moment')
         }
         return mirrors
      },
      meta: { errMsg: 'No map download sources available at the moment' },
      staleTime: 60 * 60 * 1000,
      retry: false,
      refetchInterval: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: process.env.NODE_ENV === 'production',
   })

   useEffect(() => {
      useMapDownloadStore.setState({
         isAvailableMirror: Boolean(query.data && query.data.length > 0),
      })
   }, [query.data])

   return query
}
