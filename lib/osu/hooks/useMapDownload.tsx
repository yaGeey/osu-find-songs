'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { sendMapDownloadTelemetry } from '@/lib/telemetry'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import useBaseStore from '@/contexts/useBaseStore'
import useSessionId from '@/hooks/useSessionId'
import { sendUnknownError } from '@/lib/errorHandling'
import { fetchBeatmapWithFallback, download } from '../osuDownload'

type UseMapDownloadOptions = {
   id: number
   fileName: string
} & ({ video: true; onlyNoVideo?: never } | { video: false; onlyNoVideo?: boolean })
export const useMapDownload = ({ id, fileName, video, onlyNoVideo }: UseMapDownloadOptions) => {
   const remove = useMapDownloadStore((s) => s.remove)
   const progressBlinkRef = useBaseStore((s) => s.progressNotifyRef)
   const sessionId = useSessionId()
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async () => {
         sendMapDownloadTelemetry({ sessionId, mapId: id, playlistId: window.location.pathname.split('/')[2]! }).catch(() => {})
         return video
            ? await fetchBeatmapWithFallback({ id, video: true, priority: 1, queryClient, sessionId })
            : await fetchBeatmapWithFallback({ id, video: false, onlyNoVideo, priority: 1, queryClient, sessionId })
      },
      onError: (error) => {
         remove(id)

         toast.error(
            <div>
               <p>All mirrors are down 😔</p>
               <a
                  href={`https://osu.ppy.sh/beatmapsets/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 'bold', textDecoration: 'underline', color: 'inherit' }}
               >
                  download directly from osu! website
               </a>
            </div>,
            {
               autoClose: 15000,
               closeOnClick: false,
            },
         )
         sendUnknownError(error, 'MAP_DOWNLOAD')
         progressBlinkRef?.current?.blink('error', 4000, 'Download failed')
      },
      onSuccess: (data: Blob) => {
         remove(id)
         download(data, fileName)

         const { pending } = useMapDownloadStore.getState()
         if (progressBlinkRef && progressBlinkRef.current && !Object.values(pending).length) {
            progressBlinkRef.current.blink('success', 2000)
         }
      },
   })
}
