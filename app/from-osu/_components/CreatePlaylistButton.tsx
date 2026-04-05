import { Button } from '@/components/buttons/Buttons'
import CustomLink from '@/components/CustomLink'
import Modal, { ModalProps } from '@/components/Modal'
import { createPlaylist, addToPlaylist } from '@/lib/spotify/innerApi'
import { SpotifyTrack } from '@/types/graphql-spotify/searchDesktop'
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LinearProgress } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect, useRef, useMemo } from 'react'

export default function CreatePlaylistButton({ data, dataTotal }: { data: SpotifyTrack[][]; dataTotal: number }) {
   const [isOpen, setOpen] = useState(true)
   const [textState, setTextState] = useState<'error' | 'ready' | 'creating'>('ready')
   const [step, setStep] = useState<'confirm' | 'playlistCreation' | 'allowNotifications'>('confirm')
   const isTracksLoadingFinished = data.length === dataTotal && dataTotal > 0

   const trackUris = useMemo(() => {
      const filteredErrors = data.filter(Boolean)
      const strictSearchRes = filteredErrors.filter((track) => track.length !== 20)
      return strictSearchRes.map((tracks) => tracks[0].uri)
   }, [data])

   const createPlaylistMutation = useMutation({
      mutationFn: ({ name, description }: { name: string; description: string }) => createPlaylist({ name, description }),
      onError: (err) => {
         console.error('Failed to create playlist', err)
         setTextState('error')
      },
   })

   const addItemsMutation = useMutation({
      mutationFn: async ({ playlistUri, tracksUris }: { playlistUri: string; tracksUris: string[] }) => {
         if (trackUris.length === 0) throw new Error('No tracks found to add to playlist')
         return await addToPlaylist(playlistUri, tracksUris)
      },
      onError: (err) => {
         console.error('Failed to add items to playlist', err)
         setTextState('error')
      },
   })

   // create playlist
   useEffect(() => {
      if (step === 'playlistCreation' && !createPlaylistMutation.isSuccess && createPlaylistMutation.isIdle) {
         createPlaylistMutation.mutate({
            name: 'osu! to Spotify',
            description: `Generated at ${new Date().toLocaleString()}`,
         })
         setTextState('creating')
      }
   }, [step, createPlaylistMutation.isIdle])

   // add items to playlist
   useEffect(() => {
      if (createPlaylistMutation.data && step === 'playlistCreation' && addItemsMutation.isIdle && isTracksLoadingFinished) {
         const filteredErrors = data.filter(Boolean)
         const strictSearchRes = filteredErrors.filter((track) => track.length !== 20)
         const tracks = strictSearchRes.map((tracks) => tracks[0])

         addItemsMutation.mutate({
            playlistUri: createPlaylistMutation.data.uri,
            tracksUris: tracks.map((track) => track.uri),
         })
      }
   }, [step, createPlaylistMutation.data, isTracksLoadingFinished])

   // notification
   const isNotifiedRef = useRef(false)
   useEffect(() => {
      if (!isNotifiedRef.current && isTracksLoadingFinished && createPlaylistMutation.isSuccess && addItemsMutation.isSuccess) {
         new Notification('Your playlist is ready')
         isNotifiedRef.current = true
         setTextState('ready')
      }
   }, [data, dataTotal, addItemsMutation.isSuccess, createPlaylistMutation.isSuccess])

   const renderModalContent = (): Omit<ModalProps, 'isOpen' | 'setIsOpen'> => {
      switch (step) {
         case 'confirm':
            return {
               status: 'info',
               title: 'Create Spotify playlist',
               children: (
                  <p>
                     Automatically create the playlist when loading finishes? You will get a link to the playlist immediately so
                     you can save it. Please <span className="font-medium">do not close the page</span> until the process is
                     complete.
                  </p>
               ),
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
               title: 'Enable Notifications',
               children: 'Please allow browser notifications to get notified when your playlist is ready.',
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
                              {data.length !== dataTotal
                                 ? 'You can save it while tracks are being added'
                                 : 'Thanks for using the app'}
                           </p>
                        </div>
                     ) : (
                        <div>
                           <span className="animate-pulse duration-3000">Creating playlist...</span>
                           <p className="text-sm">Please wait</p>
                        </div>
                     )}
                     <div className="mt-1">
                        {addItemsMutation.isPending ? (
                           <>
                              <span className="animate-pulse duration-3000">Adding tracks to playlist</span>
                              <div className="text-accent">
                                 <LinearProgress color="inherit" />
                              </div>
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
                              <div className="text-accent">
                                 <LinearProgress variant="determinate" value={(data.length / dataTotal) * 100} color="inherit" />
                              </div>
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
      <>
         <Button
            onClick={() => setOpen(true)}
            className="bg-main-dark-vivid md:whitespace-nowrap w-42 py-0.5 px-5"
            textClassName={textState === 'creating' ? 'animate-pulse duration-3000' : textState === 'error' ? 'text-error' : ''}
         >
            {textState === 'creating' ? 'Creating playlist' : textState === 'error' ? 'Failed to create' : 'Create playlist'}
            <FontAwesomeIcon icon={faSpotify} className="ml-1.5 text-lg mt-0.5" />
         </Button>
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
      </>
   )
}
