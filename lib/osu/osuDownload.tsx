import axios, { AxiosResponse, isAxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { sendMapDownloadTelemetry } from '@/lib/telemetry'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import RateLimitManager from '@/lib/api/RateLimitManager'
import RateLimitWithWindowManager from '@/lib/api/RateLimitWithWindowManager'
import { BaseLimiter } from '@/lib/api/Base'
import useBaseStore from '@/contexts/useBaseStore'
import useSessionId from '@/hooks/useSessionId'
import { getSourcesHealth, reportAllSourcesDown, reportSourceStatus } from '@/lib/osu/osu-source-tracker'
import { sendUnknownError } from '@/lib/client-axios'

const DOWNLOAD_PROGRESS_TIMEOUT_MS = 7000

export function download(blob: Blob, filename: string) {
   const url = window.URL.createObjectURL(blob)
   const a = document.createElement('a')
   a.style.display = 'none'
   a.href = url
   a.download = filename
   document.body.appendChild(a)
   a.click()
   document.body.removeChild(a)
   window.URL.revokeObjectURL(url)
}

const getBeatmap = async <T extends BaseLimiter>(
   manager: T,
   url: string,
   id?: number,
   update?: (id: number, downloadedBytes: number, totalBytes: number) => void,
   priority: number = 0,
) => {
   const controller = new AbortController()
   let progressTimer: NodeJS.Timeout

   const res = await manager.execute<AxiosResponse<Blob>>(
      () =>
         axios.get(url, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
               clearTimeout(progressTimer)
               progressTimer = setTimeout(() => {
                  controller.abort()
               }, DOWNLOAD_PROGRESS_TIMEOUT_MS)
               if (progressEvent.total && id) {
                  update?.(id, progressEvent.loaded, progressEvent.total)
               }
            },
            signal: controller.signal,
         }),
      priority,
   )
   return res.data
}

export async function fetchBeatmapWithFallback({
   id,
   video,
   onlyNoVideo,
   updateFn,
   priority = 0,
}: { id: number; updateFn?: (id: number, downloadedBytes: number, totalBytes: number) => void; priority?: number } & (
   | { video: true; onlyNoVideo?: never }
   | { video: false; onlyNoVideo?: boolean }
)) {
   const managerCatboy = RateLimitManager.getInstance('catboy', { showErrors: false })
   const managerAkatsuki = RateLimitManager.getInstance('akatsuki', { showErrors: false })
   const managerGatari = RateLimitManager.getInstance('gatari', { showErrors: false })
   const managerBeatconnect = RateLimitManager.getInstance('beatconnect', { showErrors: false })
   const managerSayobot = RateLimitManager.getInstance('sayobot', { showErrors: false })
   const managerNerinyan = RateLimitWithWindowManager.getInstance('nerinyan', {
      avg: 25,
      burst: 100,
      durationMs: 60000,
      showErrors: false,
   })

   const sourceConfigs =
      video || onlyNoVideo
         ? [
              { name: 'catboy', manager: managerCatboy, url: `https://catboy.best/d/${id}` },
              { name: 'beatconnect', manager: managerBeatconnect, url: `/api/proxy?url=https://beatconnect.io/b/${id}/` }, // CORS (use proxy)
              {
                 name: 'sayobot',
                 manager: managerSayobot,
                 url: `https://dl.sayobot.cn/beatmaps/download/full/${id}`,
              },
              { name: 'akatsuki', manager: managerAkatsuki, url: `https://beatmaps.akatsuki.gg/d/${id}` }, // MOVED -> NOT FOUND
              { name: 'nerinyan', manager: managerNerinyan, url: `https://api.nerinyan.moe/d/${id}?nv=0` }, // DEAD
           ]
         : [
              { name: 'gatari (nv)', manager: managerGatari, url: `/api/proxy?url=https://osu.gatari.pw/d/${id}` },
              {
                 name: 'sayobot (nv)',
                 manager: managerSayobot,
                 url: `https://dl.sayobot.cn/beatmaps/download/novideo/${id}`,
              },
              { name: 'nerinyan (nv)', manager: managerNerinyan, url: `https://api.nerinyan.moe/d/${id}?nv=1` }, // DEAD
           ]

   const sources = sourceConfigs.map((src) => ({
      name: src.name,
      fn: () => getBeatmap(src.manager, src.url, id, updateFn, priority),
   }))

   // get sources state from server
   const serverTrackerState =
      (await getSourcesHealth().catch((err) =>
         console.warn('Failed to fetch sources health from server action, proceeding without it', err),
      )) ?? {}

   let hasAttemptedDownload = false // Flag to track if we've attempted at least one download

   for (const source of sources) {
      const state = serverTrackerState[source.name] || { failures: 0, cooldownUntil: 0 }
      if (Date.now() < state.cooldownUntil) {
         console.warn(`Skipping ${source.name} due to cooldown`)
         continue
      }

      hasAttemptedDownload = true

      try {
         const res = await source.fn()
         if (state.failures > 0) reportSourceStatus(source.name, 'success').catch(() => {}) // reset state on success
         return res
      } catch (err) {
         console.warn(`${source.name} failed:`, err)
         if (isAxiosError(err) && (!err.response || err.response.status >= 500)) {
            await reportSourceStatus(source.name, 'failure').catch(() => {}) // await to ensure state is updated before next attempt
         }
      }
   }

   if (hasAttemptedDownload) {
      reportAllSourcesDown().catch(() => {}) // reduce waiting time
      throw new Error('All download sources failed')
   } else throw new Error('No available download sources at the moment')
}

type UseNoVideoAxiosOptions = {
   id: number
   fileName: string
} & ({ video: true; onlyNoVideo?: never } | { video: false; onlyNoVideo?: boolean })
export const useNoVideoAxios = ({ id, fileName, video, onlyNoVideo }: UseNoVideoAxiosOptions) => {
   const remove = useMapDownloadStore((s) => s.remove)
   const update = useMapDownloadStore((s) => s.update)
   const progressBlinkRef = useBaseStore((s) => s.progressNotifyRef)
   const sessionId = useSessionId()

   return useMutation({
      mutationFn: async () => {
         sendMapDownloadTelemetry({ sessionId, mapId: id, playlistId: window.location.pathname.split('/')[2]! }).catch(() => {})
         return video
            ? await fetchBeatmapWithFallback({ id, video: true, updateFn: update, priority: 1 })
            : await fetchBeatmapWithFallback({ id, video: false, onlyNoVideo, updateFn: update, priority: 1 })
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
