// https://github.com/eligrey/FileSaver.js/issues/796 - xhr download progress
import axios, { AxiosResponse, isAxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { sendMapDownloadTelemetry } from '@/lib/telemetry'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import RateLimitManager from '@/lib/api/RateLimitManager'
import RateLimitWithWindowManager from '@/lib/api/RateLimitWithWindowManager'
import { BaseLimiter } from '@/lib/api/Base'
import useBaseStore from '@/contexts/useBaseStore'
import { SOURCES_COOLDOWN_MS, SOURCES_MAX_FAILURES } from '@/variables'

const sourceTracker = new Map<string, { failures: number; cooldownUntil: number }>()

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

const sendTemeletry = async (mapId: number) => {
   try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return
      await sendMapDownloadTelemetry({ sessionId, mapId, playlistId: window.location.pathname.split('/')[2]! })
   } catch (err) {}
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
               }, 5000)
               if (progressEvent.total && id) {
                  update?.(id, progressEvent.loaded, progressEvent.total)
               }
            },
            signal: controller.signal,
            timeout: 5000,
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
   const managerCatboy = RateLimitManager.getInstance('catboy')
   const managerAkatsuki = RateLimitManager.getInstance('akatsuki')
   const managerGatari = RateLimitManager.getInstance('gatari')
   const managerBeatconnect = RateLimitManager.getInstance('beatconnect')
   // const managerSayobot = RateLimitManager.getInstance('sayobot')
   const managerNerinyan = RateLimitWithWindowManager.getInstance('nerinyan', { avg: 25, burst: 100, durationMs: 60000 })

   const sourceConfigs =
      video || onlyNoVideo
         ? [
              { name: 'catboy', manager: managerCatboy, url: `https://catboy.best/d/${id}` },
              { name: 'akatsuki', manager: managerAkatsuki, url: `https://akatsuki.gg/d/${id}` },
              { name: 'nerinyan', manager: managerNerinyan, url: `https://api.nerinyan.moe/d/${id}?nv=0` },
              { name: 'beatconnect', manager: managerBeatconnect, url: `https://beatconnect.io/b/${id}/` },
           ]
         : [
              { name: 'gatari (nv)', manager: managerGatari, url: `/api/proxy?url=https://osu.gatari.pw/d/${id}` },
              { name: 'nerinyan (nv)', manager: managerNerinyan, url: `https://api.nerinyan.moe/d/${id}?nv=1` },
           ]

   const sources = sourceConfigs.map((src) => ({
      name: src.name,
      fn: () => getBeatmap(src.manager, src.url, id, updateFn, priority),
   }))

   for (const source of sources) {
      const state = sourceTracker.get(source.name) || { failures: 0, cooldownUntil: 0 }
      if (Date.now() < state.cooldownUntil) {
         console.warn(`Skipping ${source.name} due to cooldown`)
         continue
      }

      try {
         const res = await source.fn()
         if (state.failures > 0) sourceTracker.set(source.name, { failures: 0, cooldownUntil: 0 })
         return res
      } catch (err) {
         console.warn(`${source.name} failed:`, err)
         if (isAxiosError(err) && (!err.response || err.response.status >= 500)) {
            state.failures++
            if (state.failures >= SOURCES_MAX_FAILURES) state.cooldownUntil = Date.now() + SOURCES_COOLDOWN_MS
            sourceTracker.set(source.name, state)
         }
      }
   }
   throw new Error('All download sources failed')
}

type UseNoVideoAxiosOptions = {
   id: number
   fileName: string
} & ({ video: true; onlyNoVideo?: never } | { video: false; onlyNoVideo?: boolean })
export const useNoVideoAxios = ({ id, fileName, video, onlyNoVideo }: UseNoVideoAxiosOptions) => {
   const remove = useMapDownloadStore((s) => s.remove)
   const update = useMapDownloadStore((s) => s.update)
   const progressBlinkRef = useBaseStore((s) => s.progressNotifyRef)

   return useMutation({
      mutationFn: async () => {
         await sendTemeletry(id)
         return video
            ? await fetchBeatmapWithFallback({ id, video: true, updateFn: update, priority: 1 })
            : await fetchBeatmapWithFallback({ id, video: false, onlyNoVideo, updateFn: update, priority: 1 })
      },
      onError: (error: any) => {
         remove(id)
         console.error('Error downloading file:', error)
         toast.error(`Can't download map, please download it directly from osu! website. \nhttps://osu.ppy.sh/beatmapsets/${id}`)
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
