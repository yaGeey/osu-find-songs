'use client'

import ProgressAsAnImage from '@/components/state/ProgressAsAnImage'
import localApiAxios from '@/lib/localApiAxios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Spinner from 'react-spinner-material'
import { useEffect, useRef, useState } from 'react'
import { getMessageFromError } from '@/utils/requests'
import PlaylistProgress, { PlaylistStatus } from './_components/PlaylistProgress'
import CommandSection from './_components/CommandSection'
import AlertBanner from './_components/AlertBanner'
import useSessionId from '@/hooks/useSessionId'

// TODO
// if tab closed - email notification
// add lazer support

export default function FromOsu() {
   const { id: clientId, isIdFetching } = useSessionId()
   const queryClient = useQueryClient()

   const {
      mutate: creatPlM,
      data: createPlMData,
      isError: isCreatePlMError,
      error: createPlError,
      isPending: isCreatePlMPending,
   } = useMutation({
      mutationKey: ['create-playlist', clientId],
      mutationFn: async (regenerate: boolean) => {
         const res = await localApiAxios.post<{
            id: string
         }>(`/spotify/playlist${regenerate ? '?regenerate=true' : ''}`, {}, { headers: { 'x-client-id': clientId } })
         return res.data
      },
      meta: { errMsg: 'f-o: Failed to create playlist for ' + clientId },
      onSuccess: () => {
         // on "start over" the cached progress belongs to the previous run;
         // reset it so the old 'filled' screen doesn't flash before the fresh status arrives
         queryClient.resetQueries({ queryKey: ['playlist-by-client-id', clientId] })
      },
   })
   const playlistId = createPlMData?.id

   const autoCreatedForRef = useRef<string | null>(null)
   useEffect(() => {
      if (!clientId || playlistId || autoCreatedForRef.current === clientId) return
      autoCreatedForRef.current = clientId
      creatPlM(false)
      Notification.requestPermission()
   }, [clientId, playlistId, creatPlM])

   // polling for progress
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
   })
   const data = pollingQ.data
   const status = data?.status

   const onPlRegenerate = () => creatPlM(true)

   // one screen at a time:
   let screen:
      | 'checking'
      | 'no-client'
      | 'create-error'
      | 'poll-error'
      | 'server-error'
      | 'command'
      | 'progress'
      | 'preparing'
   if (isIdFetching || isCreatePlMPending) screen = 'checking'
   else if (!clientId) screen = 'no-client'
   else if (isCreatePlMError) screen = 'create-error'
   else if (pollingQ.isError) screen = 'poll-error'
   else if (status === 'error') screen = 'server-error'
   else if (status === 'ready' && playlistId) screen = 'command'
   else if (status === 'processing' || status === 'filled') screen = 'progress'
   else screen = 'preparing'

   const prevStatusRef = useRef<PlaylistStatus['status'] | undefined>(undefined)
   useEffect(() => {
      const prevStatus = prevStatusRef.current
      prevStatusRef.current = status

      // notify only when this session actually watched the progress (processing -> filled),
      if (status !== 'filled' || prevStatus !== 'processing') return

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
                  <ProgressAsAnImage img={img} val={data?.processed || 0} max={data?.total || 100} size={300} />
               ) : (
                  <div className="h-[298px] w-[300px] border-2 border-main-border rounded-sm bg-main-darker" />
               )}
            </div>

            <div className="flex flex-1 flex-col justify-center min-w-0 p-6">
               {screen === 'command' && playlistId && clientId && (
                  <CommandSection playlistId={playlistId} clientId={clientId} />
               )}

               {screen === 'no-client' && <AlertBanner title="Something went wrong">Client ID not found</AlertBanner>}

               {screen === 'create-error' && (
                  <AlertBanner title="Failed to create playlist">{getMessageFromError(createPlError)}</AlertBanner>
               )}

               {screen === 'poll-error' && (
                  <AlertBanner title="Failed to fetch progress">{getMessageFromError(pollingQ.error)}</AlertBanner>
               )}

               {screen === 'server-error' && (
                  <AlertBanner title="Something went wrong">
                     {data?.status === 'error' ? data.message : 'The playlist could not be processed.'}
                  </AlertBanner>
               )}

               {screen === 'progress' && data && <PlaylistProgress data={data} onStartOver={onPlRegenerate} />}

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
