'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { sendMapDownloadTelemetry } from '@/lib/actions/telemetry'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import useBaseStore from '@/contexts/useBaseStore'
import useSessionId from '@/hooks/useSessionId'
import { sendUnknownError } from '@/lib/errorHandling'
import { fetchBeatmapWithFallback, download, BANNED_STATUSES } from '../osuDownload'
import { Status } from '@/types/Osu'

type UseMapDownloadOptions = {
   id: number
   fileName: string
   status: Status
} & ({ video: true; onlyNoVideo?: never } | { video: false; onlyNoVideo?: boolean })
export const useMapDownload = ({ id, fileName, video, onlyNoVideo, status }: UseMapDownloadOptions) => {
   const remove = useMapDownloadStore((s) => s.remove)
   const notify = useBaseStore((s) => s.notificationBlink)
   const sessionId = useSessionId()
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: async () => {
         sendMapDownloadTelemetry({ sessionId, mapId: id, playlistId: window.location.pathname.split('/')[2]! }).catch(() => {})
         if (BANNED_STATUSES.includes(status)) throw new Error(`Status not allowed`)
         return video
            ? await fetchBeatmapWithFallback({ id, video: true, priority: 1, queryClient })
            : await fetchBeatmapWithFallback({ id, video: false, onlyNoVideo, priority: 1, queryClient })
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
               autoClose: 10000,
               closeOnClick: false,
            },
         )
         sendUnknownError(error, 'MAP_DOWNLOAD')
         notify({ type: 'error', content: 'Download failed' }, 4000)
      },
      onSuccess: (data) => {
         remove(id)
         download(data, fileName)

         const { pending } = useMapDownloadStore.getState()
         if (!Object.values(pending).length) {
            notify({ type: 'success' }, 2000)
         }
      },
   })
}
