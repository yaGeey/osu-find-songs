import { BeatmapSet } from '@/types/Osu'
import { getWindowsFriendlyLocalTime } from '@/utils/dates'
import JSZip from 'jszip'
import { useState } from 'react'
import { toast } from 'react-toastify'
import sortFn from '@/app/from-spotify/[playlistId]/_utils/sortBeatmaps'
import RateLimitManager from '@/lib/limiter/RateLimitManager'
import { sendMapDownloadTelemetry } from '@/lib/actions/telemetry'
import useSessionId from '../../../hooks/useSessionId'
import { useQueryClient } from '@tanstack/react-query'
import { fetchBeatmapWithFallback, download, BANNED_STATUSES } from '../osuDownload'

export default function useDownloadAll(maps: BeatmapSet[][], sortQuery: string = 'relevance_asc') {
   const [progress, setProgress] = useState<null | number>(null)
   const [text, setText] = useState<null | string>(null)
   const manager = RateLimitManager.getInstance('downloadAllQueue')
   const sessionId = useSessionId()
   const queryClient = useQueryClient()

   // download maps
   async function handleDownloadAll() {
      const zip = new JSZip()
      setProgress(0)
      let count = 0

      const validMaps = maps
         .filter((set) => set.length)
         .map((set) => [...set].sort(sortFn(sortQuery))[0])
         .filter((b) => !BANNED_STATUSES.includes(b.status))

      const tasks = validMaps.map((b) => async () => {
         const blob = await fetchBeatmapWithFallback({ id: b.id, video: false, onlyNoVideo: !b.video, queryClient })
         const filename = `${b.id} ${b.artist} - ${b.title}.osz`

         // telemetry
         sendMapDownloadTelemetry({
            sessionId,
            mapId: b.id,
            playlistId: window.location.pathname.split('/')[2]!,
            all: true,
         }).catch(() => {})
         
         // UI
         count++
         setText(`Downloading... (${count}/${validMaps.length})`)
         setProgress((count / validMaps.length) * 99)
         console.log(`Downloaded ${filename}. Total progress ${progress}%`)

         return { filename, blob }
      })
      const result = await manager.executeBatch(tasks)
      const downloadedFiles = result.filter((r) => r) as Array<{ filename: string; blob: Blob }>

      setText('Creating zip...')
      downloadedFiles.forEach(({ filename, blob }) => zip.file(filename, blob))
      const promise = zip
         .generateAsync({ type: 'blob' }, (metadata) => {
            setText(`Creating zip... (${Math.round(metadata.percent)}%)`)
         })
         .then((blob) => {
            download(blob, `beatmaps-${getWindowsFriendlyLocalTime()}.zip`)
            setProgress(null)
            setText(null)
         })
         .catch((error) => {
            console.error('Download failed:', error)
            toast.error('Download failed')
            setProgress(-1)
         })

      toast.promise(promise, {
         error: 'Download failed',
      })
   }

   return { progress, text, handleDownloadAll }
}
