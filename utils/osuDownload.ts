// https://github.com/eligrey/FileSaver.js/issues/796 - xhr download progress
// TODO with videos error fetching download
import axios, { AxiosResponse, isAxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { sendMapDownloadTelemetry } from '@/lib/telemetry'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import RateLimitManager from '@/lib/api/RateLimitManager'
import RateLimitWithWindowManager from '@/lib/api/RateLimitWithWindowManager'
import { BaseLimiter } from '@/lib/api/Base'

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
) => {
   const controller = new AbortController()
   let progressTimer: NodeJS.Timeout

   const res = await manager.execute<AxiosResponse<Blob>>(() =>
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
      }),
   )
   return res.data
}

export async function fetchBeatmapWithFallback({
   id,
   video,
   onlyNoVideo,
   updateFn,
}: { id: number; updateFn?: (id: number, downloadedBytes: number, totalBytes: number) => void } & (
   | { video: true; onlyNoVideo?: never }
   | { video: false; onlyNoVideo?: boolean }
)) {
   const managerCatboy = RateLimitManager.getInstance('catboy')
   const managerAkatsuki = RateLimitManager.getInstance('akatsuki')
   const managerGatari = RateLimitManager.getInstance('gatari')
   const managerBeatconnect = RateLimitManager.getInstance('beatconnect')
   // const managerSayobot = RateLimitManager.getInstance('sayobot')
   const managerNerinyan = RateLimitWithWindowManager.getInstance('nerinyan', { avg: 25, burst: 100, durationMs: 60000 })

   const sources =
      video || onlyNoVideo
         ? [
              { name: 'catboy', fn: () => getBeatmap(managerCatboy, `https://catboy.best/d/${id}`, id, updateFn) },
              {
                 name: 'nerinyan',
                 fn: () => getBeatmap(managerNerinyan, `https://api.nerinyan.moe/d/${id}?nv=0`, id, updateFn),
              },
              { name: 'akatsuki', fn: () => getBeatmap(managerAkatsuki, `https://akatsuki.gg/d/${id}`, id, updateFn) },
              {
                 name: 'beatconnect',
                 fn: () => getBeatmap(managerBeatconnect, `https://beatconnect.io/b/${id}/`, id, updateFn),
              },
              //   { name: 'sayobot', fn: () => getBeatmap(managerSayobot, `https://akatsuki.gg/d/${id}`, id, update) },
           ]
         : [
              {
                 name: 'nerinyan (nv)',
                 fn: () => getBeatmap(managerNerinyan, `https://api.nerinyan.moe/d/${id}?nv=1`, id, updateFn),
              },
              { name: 'gatari (nv)', fn: () => getBeatmap(managerGatari, `https://osu.gatari.pw/d/${id}`, id, updateFn) },
           ]

   for (const source of sources) {
      try {
         return await source.fn()
      } catch (err) {
         console.warn(`${source.name} failed:`, err)
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

   return useMutation({
      mutationFn: async () => {
         await sendTemeletry(id)
         return video
            ? await fetchBeatmapWithFallback({ id, video: true, updateFn: update })
            : await fetchBeatmapWithFallback({ id, video: false, onlyNoVideo, updateFn: update })
      },
      onError: (error: any) => {
         remove(id)
         console.error('Error downloading file:', error)
         toast.error(`Can't download map, please download it directly from osu! website. \nhttps://osu.ppy.sh/beatmapsets/${id}`)
      },
      onSuccess: (data: Blob) => {
         remove(id)
         download(data, fileName)

         const { pending, progressBlinkRef } = useMapDownloadStore.getState()
         if (progressBlinkRef && progressBlinkRef.current && !Object.values(pending).length) {
            progressBlinkRef.current.blink(2000)
         }
      },
   })
}