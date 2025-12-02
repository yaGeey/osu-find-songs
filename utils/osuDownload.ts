// https://github.com/eligrey/FileSaver.js/issues/796 - xhr download progress
// TODO: xhr requests download progress add
// TODO with videos error fetching download
import axios, { AxiosResponse, isAxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { createParallelAction } from './serverActionsParallel'
import { sendMapDownloadTelemetry } from '@/lib/telemetry'
import { ProgressNotifyHandle } from '@/components/state/ProgressNotify'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import { parse } from 'path'
import { RateLimitManager } from '@/lib/RateLimitManager'

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

export const getNoVideoAxios = async (id: number) => {
   const res = await axios.get(`https://catboy.best/d/${id}`, {
      responseType: 'blob',
   })
   return res.data
}
export const getNoVideoParallel = createParallelAction(async (id: number) => {
   const res = await axios.get(`https://catboy.best/d/${id}`, {
      responseType: 'blob',
   })
   return res.data
})

const sendTemeletry = async (mapId: string) => {
   try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return
      await sendMapDownloadTelemetry({ sessionId, mapId, playlistId: window.location.pathname.split('/')[2]! })
   } catch (err) {}
}

export const useNoVideoAxios = (id: number, filename: string) => {
   const { remove, update } = useMapDownloadStore()
   return useMutation({
      mutationFn: async () => {
         await sendTemeletry(id.toString())
         const manager = RateLimitManager.getInstance('catboy', { maxConcurrency: 3 })
         const res = await manager.getRateLimited<AxiosResponse<Blob>>(() =>
            axios.get(`https://catboy.best/d/${id}`, {
               responseType: 'blob',
               onDownloadProgress: (progressEvent) => {
                  if (progressEvent.total) {
                     update(id, progressEvent.loaded, progressEvent.total)
                  }
               },
               timeout: 15000,
               timeoutErrorMessage: `Can't download map, please download it directly from osu! website. \nhttps://osu.ppy.sh/beatmapsets/${id}`,
            }),
         )
         return res.data
      },
      onError: (error: any) => {
         remove(id)
         console.error('Error downloading file:', error)
         toast.error('Error downloading file: ' + error.message)
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

export const getVideo = async (id: number) => {
   const res = await fetch(`https://osu.ppy.sh/beatmapsets/${id}/download`)
   if (!res.ok) throw new Error(await res.text())
   return res.blob()
}

function downloadXhr(url: string, filename: string): void {
   let blob: Blob
   const xhr = new XMLHttpRequest()
   xhr.open('GET', url, true)
   xhr.responseType = 'blob'
   xhr.onload = function (e): void {
      blob = new Blob([this.response])
   }
   xhr.onprogress = function (pr): void {
      console.log(pr.loaded / pr.total)
   }
   xhr.onloadend = function (e): void {
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
   xhr.send()
}
export const downloadNoVideoXhr = async (id: number, filename: string) => {
   const res = downloadXhr(`https://catboy.best/d/${id}`, filename)
   console.log(res)
}
