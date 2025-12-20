'use client'
import BgImage from '@/components/BgImage'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import Footer from '@/components/Footer'
import { twMerge as tw, twMerge } from 'tailwind-merge'
import { getPlaylist } from '@/lib/Spotify'
import { useMutation } from '@tanstack/react-query'

export default function SelectPage() {
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState<string | null>(null)
   const inputRef = useRef<HTMLInputElement>(null)
   const router = useRouter()

   function parseIdFromUrl(url: string) {
      const parts = url.split('/')
      return parts[parts.length - 1].split('?')[0]
   }

   const mutation = useMutation({
      mutationFn: async (id: string) => await getPlaylist(id),
      onSuccess: (data, playlistId) => {
         setError(null)
         setIsLoading(true)
         router.push('/from-spotify/' + playlistId)
      },
      onError: () => {
         setError('Playlist not found or is private')
      },
   })

   return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white">
         <BgImage />
         <div className="flex flex-col justify-center items-center flex-1 text-nowrap mt-1">
            <h1 className="text-4xl tracking-tight font-semibold mb-3">Select a public playlist</h1>
            <h3 className="text-lg text-white/60">*NOT Albums, Daily Mixes, or Private playlists</h3>
            <h2 className="text-xl mt-7 mb-3">Right-click the playlist → Share → Copy link to playlist</h2>

            <div className="relative w-full">
               <input
                  placeholder="Spotify playlist link"
                  pattern="https://open.spotify.com/playlist/.*"
                  onChange={(e) => {
                     if (e.target.value) {
                        if (e.target.checkValidity()) {
                           mutation.mutate(parseIdFromUrl(e.target.value))
                        } else {
                           setError(e.target.value.search('album') !== -1 ? 'Albums are not supported' : 'Invalid link')
                        }
                     } else setError(null)
                  }}
                  disabled={isLoading || mutation.isPending}
                  ref={inputRef}
                  className={twMerge(
                     'bg-gray-100 disabled:border-success hover:brightness-115 text-black border-3 w-full border-main-darker rounded-lg pl-2 py-2 pr-8 invalid:[&:not(:placeholder-shown)]:border-error transition-all outline-0',
                     !error ? ' valid:[&:not(:placeholder-shown)]:border-success' : 'border-error',
                  )}
               ></input>
               <FontAwesomeIcon
                  icon={faSpotify}
                  className="absolute top-1/2 transform -translate-y-1/2 right-2 text-lg text-black/80"
               />
            </div>
            <div className="h-6">
               {(isLoading || mutation.isPending) && <span className={tw('text-center w-full text-success')}>Loading..</span>}
               {error && !isLoading && !mutation.isPending && (
                  <span className={tw('text-center w-full text-error')}>{error ?? 'e'}</span>
               )}
            </div>
         </div>
         <Footer />
      </div>
   )
}
