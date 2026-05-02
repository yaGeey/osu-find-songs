'use client'
import axios, { AxiosResponse, isAxiosError } from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import { Mirror, getDownloadUrl } from './osuMirrors'
import { BaseLimiter } from '../limiter/Base'

const DOWNLOAD_PROGRESS_TIMEOUT_MS = 1000

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

const executeDownload = async (manager: BaseLimiter, url: string, id: number, priority: number = 0) => {
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
                  useMapDownloadStore.getState().update?.(id, progressEvent.loaded, progressEvent.total)
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
   priority = 0,
   queryClient,
   sessionId,
}: { id: number; priority?: number; queryClient: QueryClient; sessionId: string | undefined } & (
   | { video: true; onlyNoVideo?: never }
   | { video: false; onlyNoVideo?: boolean }
)) {
   const wantsVideo = Boolean(video || onlyNoVideo)

   const mirrors: Mirror[] = await queryClient.ensureQueryData({ queryKey: ['osuMirrors'] })
   if (!mirrors || mirrors.length === 0) {
      throw new Error('fetchBeatmapWithFallback: no mirrors available')
   }

   for (const mirror of mirrors) {
      const url = getDownloadUrl(mirror, wantsVideo, id)
      if (!url) continue

      try {
         const res = await executeDownload(mirror.manager, url, id, priority)
         // if (sessionId) reportSourceStatus(mirror.name, 'success', sessionId).catch(() => {}) // reset state on success
         return res
      } catch (err) {
         console.warn(`${mirror.name} failed:`, err)
         if (sessionId && isAxiosError(err)) {
            // await reportSourceStatus(mirror.name, 'failure', sessionId).catch(() => {}) // await to ensure state is updated before next attempt
         }
      }
   }

   throw new Error('fetchBeatmapWithFallback: All download sources failed')
}
