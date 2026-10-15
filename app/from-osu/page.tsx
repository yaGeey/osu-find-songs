'use client'

import ProgressAsAnImage from '@/components/state/ProgressAsAnImage'
import localApiAxios from '@/lib/localApiAxios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Spinner from 'react-spinner-material'
import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { getMessageFromError } from '@/utils/requests'
import PlaylistProgress, { PlaylistStatus } from './_components/PlaylistProgress'
import CommandSection from './_components/CommandSection'
import AlertBanner from './_components/AlertBanner'
import useSessionId from '@/hooks/useSessionId'
import { triggerFooterShine } from '@/contexts/useFooterShine'

// TODO
// if tab closed - email notification
// add lazer support

export default function FromOsu() {
   const { id: clientId, isIdFetching } = useSessionId()
   const queryClient = useQueryClient()

   useEffect(() => {
      Notification.requestPermission()
   }, [])

   // start over / try again: drop the current record so the next upload creates a fresh playlist
   const resetPlM = useMutation({
      mutationFn: async () => {
         await localApiAxios.post('/spotify/playlist/reset', null, {
            headers: { 'x-client-id': clientId },
         })
      },
      meta: { errMsg: 'f-o: Failed to reset playlist for ' + clientId },
      onSuccess: () => {
         // clear the cached status so the old 'filled'/'error' screen doesn't linger
         queryClient.resetQueries({ queryKey: ['playlist-by-client-id', clientId] })
      },
   })

   // polling
   const pollingQ = useQuery({
      queryKey: ['playlist-by-client-id', clientId],
      queryFn: async () => {
         const res = await localApiAxios.get<PlaylistStatus>('/spotify/playlist', {
            params: { clientId },
            headers: { 'x-client-id': clientId },
            validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
         })
         if (res.status === 404) return null
         return res.data
      },
      meta: { errMsg: `f-o: Failed to fetch progress for user with id of ${clientId}` },
      refetchInterval: 1000,
      // don't poll before the client id is known — the request would go out without x-client-id (400)
      enabled: !!clientId,
   })
   const pl = pollingQ.data
   const status = pl?.status
   const playlistId = pl?.id

   const onPlRegenerate = () => resetPlM.mutate()

   // one screen at a time:
   let screen:
      | 'checking'
      | 'no-client'
      | 'reset-error'
      | 'poll-error'
      | 'server-error'
      | 'command'
      | 'progress'
      | 'preparing'
   if (isIdFetching || resetPlM.isPending) screen = 'checking'
   else if (!clientId) screen = 'no-client'
   else if (resetPlM.isError) screen = 'reset-error'
   else if (pollingQ.isError) screen = 'poll-error'
   else if (status === 'error') screen = 'server-error'
   else if (status === 'processing' || status === 'filled') screen = 'progress'
   else if (status === 'ready' || pl === null) screen = 'command'
   else screen = 'preparing'

   const prevStatusRef = useRef<PlaylistStatus['status'] | undefined>(undefined)
   useEffect(() => {
      const prevStatus = prevStatusRef.current
      prevStatusRef.current = status

      // this session actually watched the progress (processing -> filled),
      if (status !== 'filled' || prevStatus !== 'processing') return

      triggerFooterShine()
      const notification = new Notification('Your playlist is ready!', {
         body: 'Open it in Spotify to listen to your tracks',
         icon: '/kit.png',
      })
      notification.onclick = () => {
         window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank')
      }
   }, [status, playlistId])

   const [img, setImg] = useState<HTMLImageElement | null>(null)
   useEffect(() => {
      const image = new Image()
      image.src = '/kit.png'
      image.onload = () => setImg(image)
   }, [])

   return (
      <main className="min-h-screen grid place-items-center">
         <div className="w-[820px] h-[400px] bg-main-lightest border-4 border-main-dark-vivid rounded-xl p-6 flex gap-6">
            <div className="grid place-items-center">
               {img && status !== 'error' ? (
                  <ProgressAsAnImage img={img} val={pl?.processed || 0} max={pl?.total || 100} size={300} />
               ) : (
                  <div className="h-[298px] w-[300px] border-2 border-main-border rounded-sm bg-main-darker" />
               )}
            </div>

            <div className="flex flex-1 flex-col justify-center min-w-0 p-6">
               {screen === 'command' && clientId && <CommandSection clientId={clientId} />}

               {screen === 'no-client' && <AlertBanner title="Something went wrong">Client ID not found</AlertBanner>}

               {screen === 'reset-error' && (
                  <AlertBanner title="Failed to start over">{getMessageFromError(resetPlM.error)}</AlertBanner>
               )}

               {screen === 'poll-error' && (
                  <AlertBanner title="Failed to fetch progress">{getMessageFromError(pollingQ.error)}</AlertBanner>
               )}

               {screen === 'server-error' && (
                  <div className="flex w-full flex-col gap-3 items-center">
                     <AlertBanner title="Something went wrong">
                        {pl?.status === 'error' ? pl.message : 'The playlist could not be processed.'}
                     </AlertBanner>
                     <button
                        type="button"
                        onClick={onPlRegenerate}
                        className="group flex w-fit shrink-0 cursor-pointer items-center gap-1.5 font-medium text-main-gray transition-colors hover:text-black"
                     >
                        <RotateCcw size={14} className="shrink-0 transition-transform group-hover:-rotate-45" />
                        Try again
                     </button>
                  </div>
               )}

               {screen === 'progress' && pl && <PlaylistProgress data={pl} onStartOver={onPlRegenerate} />}

               {(screen === 'checking' || screen === 'preparing') && (
                  <div className="flex flex-col items-center gap-4 py-4 text-center">
                     <Spinner radius={40} stroke={3} visible={true} />
                     <div>
                        <p className="text-xl font-semibold text-black">Preparing your playlist</p>
                        <p className="text-sm text-black/60">This may take a moment</p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </main>
   )
}
