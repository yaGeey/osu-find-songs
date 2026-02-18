import CustomLink from '@/components/CustomLink'
import Modal, { ModalProps } from '@/components/Modal'
import { createPlaylist, addToPlaylist } from '@/lib/spotify/innerApi'
import { SpotifyTrack } from '@/types/graphql-spotify/searchDesktop'
import { LinearProgress } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'

export default function CreatePlaylistDialog({
   isOpen,
   setOpen,
   data,
   dataTotal,
   onCreating,
}: {
   isOpen: boolean
   setOpen: (open: boolean) => void
   data: SpotifyTrack[][]
   dataTotal: number
   onCreating?: (isCreating: boolean) => void
}) {
   const [step, setStep] = useState<'confirm' | 'playlistCreation' | 'allowNotifications'>('confirm')

   const createPlaylistMutation = useMutation({
      mutationFn: ({ name, description }: { name: string; description: string }) => createPlaylist({ name, description }),
      onError: (err) => {
         console.error('Failed to create playlist', err)
         onCreating?.(false)
      },
   })
   const addItemsMutation = useMutation({
      mutationFn: ({ playlistUri, tracksUris }: { playlistUri: string; tracksUris: string[] }) =>
         addToPlaylist(playlistUri, tracksUris),
      onError: (err) => {
         console.error('Failed to add items to playlist', err)
         onCreating?.(false)
      },
   })

   // create playlist
   useEffect(() => {
      if (step === 'playlistCreation' && !createPlaylistMutation.isSuccess && createPlaylistMutation.isIdle) {
         createPlaylistMutation.mutate({
            name: 'osu! to Spotify',
            description: `Generated at ${new Date().toLocaleString()}`,
         })
         onCreating?.(true)
      }
   }, [step, createPlaylistMutation.isIdle])

   // add items to playlist
   useEffect(() => {
      if (createPlaylistMutation.data && step === 'playlistCreation' && addItemsMutation.isIdle && !addItemsMutation.isSuccess) {
         const filteredErrors = data.filter(Boolean)
         const strictSearchRes = filteredErrors.filter((track) => track.length !== 20)
         const tracks = strictSearchRes.map((tracks) => tracks[0])

         addItemsMutation.mutate({
            playlistUri: createPlaylistMutation.data.uri,
            tracksUris: tracks.map((track) => track.uri),
         })
      }
   }, [step, createPlaylistMutation.data])

   // notify when playlist is ready
   const isNotifiedRef = useRef(false)
   useEffect(() => {
      if (!isNotifiedRef.current && data.length === dataTotal && dataTotal > 0) {
         new Notification('Your playlist is ready')
         isNotifiedRef.current = true
         onCreating?.(false)
      }
   }, [data, dataTotal])

   const renderModalContent = (): Omit<ModalProps, 'isOpen' | 'setIsOpen'> => {
      switch (step) {
         case 'confirm':
            return {
               status: 'info',
               title: 'Create Spotify playlist',
               children:
                  'Create playlist automatically on loading end? You will get a url to future playlist so you can save it now. Just do not close the page untill finish.',
               buttons: [
                  {
                     onClick: () => {
                        if (Notification.permission === 'granted') setStep('playlistCreation')
                        else {
                           setStep('allowNotifications')
                           Notification.requestPermission().then((permission) => {
                              if (permission === 'granted') setStep('playlistCreation')
                           })
                        }
                     },
                     children: 'Create now',
                     className: 'w-31',
                  },
                  { onClick: () => setOpen(false), children: 'Later', className: 'w-31' },
               ],
            }
         case 'allowNotifications':
            return {
               status: 'warning',
               title: 'Create Spotify playlist',
               children: 'To get notified when the playlist is ready, please allow notifications in your browser',
               buttons: [
                  {
                     onClick: () => setStep('playlistCreation'),
                     children: 'Continue',
                     className: 'w-31',
                  },
               ],
            }
         case 'playlistCreation': {
            const plUrl = createPlaylistMutation.data
               ? `https://open.spotify.com/playlist/${createPlaylistMutation.data.uri.split(':').pop()}`
               : null
            const isError = createPlaylistMutation.isError || addItemsMutation.isError
            const status = isError ? 'error' : !plUrl || addItemsMutation.isPending ? 'loading' : 'success'
            return {
               status,
               title: 'Create Spotify playlist',
               children: (
                  <div>
                     {plUrl ? (
                        <div>
                           <span>
                              Your playlist is ready!{' '}
                              <CustomLink href={plUrl} showIcon reverseHover className="font-medium">
                                 Open in Spotify
                              </CustomLink>
                           </span>
                           <p className="text-sm">
                              {data.length === dataTotal
                                 ? 'You can save it while tracks are being added'
                                 : 'Thanks for using the app'}
                           </p>
                        </div>
                     ) : (
                        <span className="animate-pulse">Creating playlist, please wait...</span>
                     )}
                     <div className="mt-1">
                        {addItemsMutation.isPending ? (
                           <>
                              <span className="animate-pulse">Adding tracks to playlist</span>
                              <LinearProgress />
                           </>
                        ) : data.length === dataTotal ? (
                           <>
                              <span>All tracks added &#10004;</span>
                              <div className="text-success">
                                 <LinearProgress variant="determinate" value={100} color="inherit" />
                              </div>
                           </>
                        ) : (
                           <>
                              <span className="animate-pulse">
                                 Searching on Spotify ({data.length}/{dataTotal})
                              </span>
                              <LinearProgress variant="determinate" value={(data.length / dataTotal) * 100} />
                           </>
                        )}
                     </div>
                     {isError && <p className="text-error">Something went wrong =(</p>}
                  </div>
               ),
               buttons: [{ children: 'Hide this window', onClick: () => setOpen(false) }],
            }
         }
         default:
            throw new Error(`${step satisfies never}`)
      }
   }
   const content = renderModalContent()

   return (
      <Modal
         isOpen={isOpen}
         setIsOpen={() => setOpen(false)}
         buttons={content.buttons}
         status={content.status}
         title={content.title}
         blockClosing={content.blockClosing}
      >
         {content.children}
      </Modal>
   )
}
