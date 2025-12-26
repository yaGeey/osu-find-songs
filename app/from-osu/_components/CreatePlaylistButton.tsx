'use client'
import { Track } from '@/types/Spotify'
import { addItemsToPlaylist, createPlaylist, fetchMyProfile, fetchSpotify, getServerToken } from '@/lib/Spotify'
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

   const mutation = useMutation({
      mutationFn: ({ playlistId, uris }: { playlistId: string; uris: string[] }) => addItemsToPlaylist(playlistId, uris),
   })

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
         // handleModal(<h1>You must be logged in your Spotify account to continue!</h1>, 'warning', navigateToAuth, 'Login')
         // return
      }

      try {
         handleModal(<h1 className="animate-pulse font-semibold">Getting profile...</h1>, 'loading')
         let profile: SpotifyApi.CurrentUsersProfileResponse
         try {
            profile = await fetchMyProfile()
         } catch (err) {
            console.error(err)
            throw new Error('Failed to fetch profile')
         }

         handleModal(<h1 className="animate-pulse font-semibold">Creating playlist...</h1>, 'loading')
         let playlist: SpotifyApi.CreatePlaylistResponse
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

         handleModal(<h1 className="animate-pulse font-semibold">Putting tracks in your playlist...</h1>, 'loading')

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
                  playlistId: playlist.id,
                  uris: chunk.map((track) => track.uri),
               }),
            )
         }

         Promise.all(promises)
            .then(() => {
               handleModal(
                  <>
                     <p>
                        ❤️ Like the playlist to save it to your library, <br /> 🔁 or copy tracks with Ctrl+A, C, then V in your
                        playlist.
                     </p>
                     <ExternalLink href={playlist!.external_urls.spotify} className="text-black underline">
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
            // disabled={isDisabled}
            onClick={() => handleCreatePlaylist()}
            data-tooltip-id="tooltip-1"
            data-tooltip-content="Create playlist on your Spotify account and populate it with tracks with filter 'Exact Spotify match'"
            className={tw('bg-main-dark-vivid md:whitespace-nowrap w-fit py-0.5 px-5', className)}
         >
            Create playlist
            <FontAwesomeIcon icon={faSpotify} className="ml-1.5 text-lg mt-0.5" />
         </Button>

         <Modal
            isOpen={isModalOpen}
            buttons={[
               {
                  onClick: () => setIsModalOpen(false),
                  children: 'Close',
                  className: 'bg-main-dark',
               },
               {
                  onClick: onOkayFn,
                  children: onOkayText,
                  className: 'bg-success',
               },
            ]}
            status={state}
            setIsOpen={() => setIsModalOpen(false)}
            title="Create Spotify Playlist"
         >
            {modalContent}
         </Modal>
      </>
   )
}
