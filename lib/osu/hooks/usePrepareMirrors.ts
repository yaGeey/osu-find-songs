import { useQuery } from '@tanstack/react-query'
import { getDeadMirrors } from '../actions/osuMirrorsTracker'
import { getPrioritizedMirrorsFilteredByDead } from '../osuMirrors'

export default function usePrepareMirrors() {
   useQuery({
      queryKey: ['osuMirrors'],
      queryFn: async () => {
         // const deadMirrors = await getDeadMirrors().catch((err) => {
         //    console.warn('Failed to fetch sources health from server action, proceeding without it', err)
         //    return []
         // })

         const mirrors = await getPrioritizedMirrorsFilteredByDead()
         if (mirrors.length === 0) {
            throw new Error('No map download sources available at the moment.')
         }
         return mirrors
      },
      staleTime: 60 * 60 * 1000,
      retry: false,
      refetchInterval: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: process.env.NODE_ENV === 'production',
   })
   return null
}
