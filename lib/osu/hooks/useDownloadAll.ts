import { BeatmapSet } from '@/types/Osu'
import { getWindowsFriendlyLocalTime } from '@/utils/dates'
import JSZip from 'jszip'
import { useState } from 'react'
import { toast } from 'react-toastify'
import sortFn from '@/app/from-lastfm/[username]/_utils/sortBeatmaps'
import RateLimitManager from '@/lib/limiter/RateLimitManager'
import useSessionId from '../../../hooks/useSessionId'
import { useQueryClient } from '@tanstack/react-query'
import { fetchBeatmapWithFallback, download } from '../osuDownload'
import { sendUnknownError } from '@/lib/errorHandling'

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

      const valid = maps.filter((set) => set.length)
      const tasks = valid.map((set) => async () => {
         const b: BeatmapSet = [...set].sort(sortFn(sortQuery))[0]

         const filename = `${b.id} ${b.artist} - ${b.title}.osz`
         const blob = await fetchBeatmapWithFallback({ id: b.id, video: false, onlyNoVideo: !b.video, sessionId, queryClient })

         count++
         setText(`Downloading... (${count}/${valid.length})`)
         setProgress((count / valid.length) * 99)

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
            toast.error('Download failed')
            sendUnknownError(error, 'DOWNLOAD_ALL', false)
            setProgress(-1)
         })

      toast.promise(promise, {
         error: 'Download failed',
      })
   }

   return { progress, text, handleDownloadAll }
}
