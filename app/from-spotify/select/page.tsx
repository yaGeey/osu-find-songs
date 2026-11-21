'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { twMerge } from 'tailwind-merge'
import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchPlaylist, warmUpInternalTokens } from '@/lib/spotify/actions/innerApi'
import LoadingDots from '@/components/state/LoadingDots'

export default function SelectPage() {
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState<string | null>(null)
   const inputRef = useRef<HTMLInputElement>(null)
   const router = useRouter()

   const tokensQ = useQuery({
      queryKey: ['spotifyIntTokens'],
      queryFn: () => warmUpInternalTokens(),
      enabled: false,
   })

   function parseIdFromUrl(url: string) {
      const parts = url.split('/')
      return parts[parts.length - 1].split('?')[0]
   }

   const mutation = useMutation({
      mutationFn: async (id: string) => {
         const res = await fetchPlaylist(id)
         if (!res) {
            setError('Playlist not found or is private')
            return
         }
         setError(null)
         setIsLoading(true)
         router.push('/from-spotify/' + id)
      },
      onError: (e) => setError('Unexpected error occured'),
   })

   return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-5 3xl:p-8 4xl:p-10">
         <div className="flex flex-col justify-center items-center flex-1 sm:text-nowrap mt-1 w-[min(560px,92vw)] 3xl:w-[720px] 4xl:w-[860px] 5xl:w-[980px]">
            <h1 className="text-4xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl max-sm:text-2xl tracking-tight font-semibold mb-3 3xl:mb-5 4xl:mb-6 text-center text-balance">
               Select a public playlist
            </h1>
            <h3 className="text-lg 3xl:text-xl 4xl:text-2xl 5xl:text-3xl max-sm:text-sm text-white/60 text-center">
               *NOT Albums, Daily Mixes, or Private playlists
            </h3>
            {/*TODO <h3 className="text-lg max-sm:text-sm text-white/60">Even private ones work!</h3> */}
            <h2 className="text-xl 3xl:text-2xl 4xl:text-3xl 5xl:text-4xl max-sm:text-base mt-7 3xl:mt-10 4xl:mt-12 mb-3 3xl:mb-5 text-center">
               Right-click the playlist → Share → Copy link to playlist
            </h2>

            <div className="relative w-full">
               <input
                  placeholder="Spotify playlist link"
                  pattern="https?://open\.spotify\.com/playlist/[a-zA-Z0-9]{22}(\?.*)?"
                  onChange={(e) => {
                     if (e.target.value) {
                        if (e.target.checkValidity()) {
                           mutation.mutate(parseIdFromUrl(e.target.value))
                        } else {
                           setError(e.target.value.search('album') !== -1 ? 'Albums are not supported' : 'Invalid link')
                        }
                     } else setError(null)
                  }}
                  disabled={tokensQ.isError || tokensQ.isFetching || tokensQ.isStale || isLoading || mutation.isPending}
                  ref={inputRef}
                  className={twMerge(
                     'bg-gray-100 disabled:bg-gray-100/50 hover:brightness-115 text-black border-3 w-full border-main-darker rounded-lg 3xl:rounded-xl pl-2 3xl:pl-4 py-2 3xl:py-3 4xl:py-4 pr-8 3xl:pr-10 4xl:pr-12 3xl:text-lg 4xl:text-xl invalid:[&:not(:placeholder-shown)]:border-error transition-all outline-0',
                     !error && !tokensQ.isError ? ' valid:[&:not(:placeholder-shown)]:border-success' : 'border-error',
                  )}
               ></input>
               <FontAwesomeIcon
                  icon={faSpotify}
                  className="absolute top-1/2 transform -translate-y-1/2 right-2 3xl:right-3 4xl:right-4 text-lg 3xl:text-xl 4xl:text-2xl text-black/80"
               />
            </div>
            <div className="min-h-6 3xl:min-h-8 *:text-center *:w-full *:whitespace-normal font-medium mt-1 3xl:mt-2 3xl:text-lg 4xl:text-xl">
               {(isLoading || mutation.isPending) && (
                  <p className="text-success">
                     Loading
                     <LoadingDots />
                  </p>
               )}
               {(tokensQ.isError || (tokensQ.isFetched && !tokensQ.data)) && (
                  <p className="text-error">
                     <p>Required tokens were not fetched due to a server-side issue.</p> <p>Please try again later.</p>
                  </p>
               )}
               {tokensQ.isFetching && (
                  <p className="text-white/60">
                     Fetching required tokens
                     <LoadingDots />
                  </p>
               )}
               {error && <p className="text-error">{error ?? 'Unexpected error occured'}</p>}
            </div>
         </div>
      </div>
   )
}
