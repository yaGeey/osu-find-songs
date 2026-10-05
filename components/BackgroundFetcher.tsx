import usePrepareMirrors from '@/lib/osu/hooks/usePrepareMirrors'
import { getInternalTokens } from '@/lib/spotify/actions/innerApi'
import { useQuery } from '@tanstack/react-query'

export default function BackgroundFetcher() {
   useQuery({
      queryKey: ['spotifyIntTokens'],
      queryFn: () => getInternalTokens(),
      meta: { errMsg: 'Could not fetch necessary tokens for From Spotify page. Please reload the page or wait.' },
      retry: 5,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
   })

   usePrepareMirrors()

   return null
}
