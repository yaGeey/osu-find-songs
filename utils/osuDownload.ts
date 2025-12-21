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

const sendTemeletry = async (mapId: string) => {
   try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return
      await sendMapDownloadTelemetry({ sessionId, mapId, playlistId: window.location.pathname.split('/')[2]! })
   } catch (err) {}
}

const getBeatmap = async <T extends BaseLimiter>(
   manager: T,
   url: string,
   id: number,
   update: (id: number, downloadedBytes: number, totalBytes: number) => void,
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
            if (progressEvent.total) {
               update(id, progressEvent.loaded, progressEvent.total)
            }
         },
         signal: controller.signal,
      }),
   )
   return res.data
}

export const useNoVideoAxios = (id: number, filename: string) => {
   const { remove, update } = useMapDownloadStore()
   const managerCatboy = RateLimitManager.getInstance('catboy', { maxConcurrency: 1 })
   //? https://nerinyan.stoplight.io/docs/nerinyan-api/df11b327494c9-download-beatmapset
   const managerNerinyan = RateLimitWithWindowManager.getInstance('nerinyan', { avg: 25, burst: 100, durationMs: 60000 })

   return useMutation({
      mutationFn: async () => {
         await sendTemeletry(id.toString())
         try {
            return await getBeatmap(managerCatboy, `https://catboy.best/d/${id}`, id, update)
         } catch (err) {
            console.warn('Catboy failed, falling back to Nerinyan', err)
            return await getBeatmap(managerNerinyan, `https://api.nerinyan.moe/d/${id}`, id, update)
         }
      },
      onError: (error: any) => {
         remove(id)
         console.error('Error downloading file:', error)
         toast.error(`Can't download map, please download it directly from osu! website. \nhttps://osu.ppy.sh/beatmapsets/${id}`)
      },
      onSuccess: (data: Blob) => {
         remove(id)
         download(data, filename)

         const { pending, progressBlinkRef } = useMapDownloadStore.getState()
         if (progressBlinkRef && progressBlinkRef.current && !Object.values(pending).length) {
            progressBlinkRef.current.blink(2000)
         }
      },
   })
}
