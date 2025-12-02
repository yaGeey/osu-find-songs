import { RateLimitManager } from '@/lib/RateLimitManager'
import { BeatmapSet } from '@/types/Osu'
import { getWindowsFriendlyLocalTime } from '@/utils/dates'
import { download } from '@/utils/osuDownload'
import JSZip from 'jszip'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { customAxios } from '@/lib/axios'
import sortFn from '@/app/from-spotify/[playlistId]/_utils/sortBeatmaps'

const manager = RateLimitManager.getInstance('catboy', { maxConcurrency: 1 })

export default function useDownloadAll(maps: BeatmapSet[][], sortQuery: string = 'relevance_asc') {
   const [progress, setProgress] = useState<null | number>(null)
   const [text, setText] = useState<null | string>(null)

   // download maps
   async function handleDownloadAll() {
      const zip = new JSZip()
      setProgress(0)
      let count = 0

      const valid = maps.filter((set) => set.length)
      const tasks = valid.map((set) => async () => {
         const b: BeatmapSet = [...set].sort(sortFn(sortQuery))[0]
         const filename = `${b.id} ${b.artist} - ${b.title}.osz`
         const res = await customAxios.get(`https://catboy.best/d/${b.id}`, {
            responseType: 'blob',
            timeout: 15000,
         })

         // UI
         count++
         setText(`Downloading... (${count}/${valid.length})`)
         setProgress((count / valid.length) * 99)
         console.log(`Downloaded ${filename}`)

         return { ...res, filename, blob: res.data }
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
         success: 'Downloaded successfully',
         error: 'Download failed',
      })
   }

   return { progress, text, handleDownloadAll }
}
