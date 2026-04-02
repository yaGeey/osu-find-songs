import { getDeadMirrors } from '@/lib/osu/actions/osuMirrorsTracker'
import usePrepareMirrors from '@/lib/osu/hooks/usePrepareMirrors'
import { getPrioritizedMirrorsFilteredByDead } from '@/lib/osu/osuMirrors'
import { getInternalTokens } from '@/lib/spotify/innerApi'
import { useQuery } from '@tanstack/react-query'

export default function BackgroundFetcher() {
   // Sptotify Internal Tokens
   useQuery({
      queryKey: ['spotifyIntTokens'],
      queryFn: () =>
         getInternalTokens().catch(() => {
            throw new Error('Service is currently unavailable. Could not fetch necessary tokens. Please try again later.')
         }),
      throwOnError: true,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
   })

   usePrepareMirrors()

   return null
}
