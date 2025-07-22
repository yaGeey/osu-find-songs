'use client'
import { Track } from '@/types/Spotify'
import { AddItemsToPlaylist, createPlaylist, fetchMyProfile } from '@/lib/Spotify'
import { useMutation } from '@tanstack/react-query'
import React, { useState } from 'react'
import Modal from '@/components/Modal'
import { Button } from '@/components/buttons/Buttons'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { twMerge as tw } from 'tailwind-merge'
import ExternalLink from '@/components/ExternalLink'

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
   isDisabled: boolean
   data: Track[][]
   className?: string
}
export default function CreatePlaylistButton({ data, className, isDisabled, ...props }: Props) {
   const [isModalOpen, setIsModalOpen] = useState(false)
   const [state, setState] = useState<'error' | 'success' | 'warning' | 'info' | 'loading'>('info')
   const [modalContent, setModalContent] = useState<React.ReactNode | null>(null)
   const [onOkayFn, setOnOkayFn] = useState<() => void>(() => {})
   const [onOkayText, setOnOkayText] = useState<string | undefined>('Okay')
   const router = useRouter()

   const mutation = useMutation({
      mutationFn: ({ playlistId, uris }: { playlistId: string; uris: string[] }) => AddItemsToPlaylist(playlistId, uris),
   })

   function navigateToAuth() {
      const encodeRedirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!)
      const clientId = process.env.NEXT_PUBLIC_AUTH_SPOTIFY_ID
      const scope = 'playlist-modify-public playlist-modify-private'
      const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeRedirectUri}&scope=${scope}`
      router.push(url)
   }

   function handleModal(
      content: React.ReactNode,
      state: 'error' | 'success' | 'warning' | 'info' | 'loading',
      onOkayFn: () => void = () => {},
      onOkayText?: string,
   ) {
      setModalContent(content)
      setState(state)
      setOnOkayFn(() => onOkayFn)
      setOnOkayText(onOkayText)
   }

   async function handleCreatePlaylist() {
      setIsModalOpen(true)
      if (!Cookies.get('spotify_oauth_access_token')) {
         handleModal(<h1>You must be logged in your Spotify account to continue!</h1>, 'warning', navigateToAuth, 'Login')
         return
      }

      try {
         handleModal(<h1 className="animate-pulse">Fetching profile...</h1>, 'loading')
         let profile
         try {
            profile = await fetchMyProfile()
         } catch (err) {
            console.error(err)
            throw new Error('Failed to fetch profile')
         }

         handleModal(<h1 className="animate-pulse">Creating playlist...</h1>, 'loading')
         let playlist
         try {
            playlist = await createPlaylist({
               userId: profile.id,
               name: 'osu! to Spotify',
               description: `Generated playlist by ${process.env.NEXT_PUBLIC_URL} at ${new Date().toLocaleString()}`,
            })
         } catch (err) {
            console.error(err)
            throw new Error('Failed to create playlist')
         }

         handleModal(<h1 className="animate-pulse">Putting tracks in your playlist...</h1>, 'loading')

         // TODO sort by popularity?
         const filteredErrors = data.filter(Boolean)
         const strictSearchRes = filteredErrors.filter((track) => track.length !== 20)
         const tracks = strictSearchRes.map((tracks) => tracks[0])

         const promises = []
         const chunkSize = 100
         for (let i = 0; i < tracks.length; i += chunkSize) {
            const chunk = tracks.slice(i, i + chunkSize)
            promises.push(
               mutation.mutateAsync({
                  playlistId: playlist!.id,
                  uris: chunk.map((track) => track.uri),
               }),
            )
         }

         Promise.all(promises)
            .then(() => {
               handleModal(
                  <>
                     <h1>Success! Visit your new playlist:</h1>
                     <ExternalLink href={playlist!.external_urls.spotify} className="text-black">
                        {playlist!.external_urls.spotify}
                     </ExternalLink>
                  </>,
                  'success',
               )
            })
            .catch((err) => {
               console.error(err)
               handleModal(<h1>Failed to add tracks to playlist</h1>, 'error')
            })
      } catch (error) {
         handleModal(<h1>{error instanceof Error ? error.message : 'An unexpected error occurred'}</h1>, 'error')
      }
   }

   return (
      <>
         <Button
            {...props}
            disabled={isDisabled}
            onClick={() => handleCreatePlaylist()}
            data-tooltip-id="tooltip-1"
            data-tooltip-content="Create playlist on your Spotify account and populate it with tracks with filter 'Exact Spotify match'"
            className={tw('bg-main-border/50 text-white py-1.5 md:whitespace-nowrap min-w-[135px]', className)}
         >
            Create Spotify playlist
            <FontAwesomeIcon icon={faSpotify} className="ml-1.5 text-lg mt-0.5" />
         </Button>

         <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onOkay={onOkayFn}
            state={state}
            okBtn={onOkayText}
            closeBtn="Close"
         >
            {modalContent}
         </Modal>
      </>
   )
}
