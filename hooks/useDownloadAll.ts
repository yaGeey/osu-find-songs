import { BeatmapSet } from '@/types/Osu'
import { download, getNoVideoAxios } from '@/utils/osuDownload'
import { UseQueryResult } from '@tanstack/react-query'
import JSZip from 'jszip'
import { useState } from 'react'
import { toast } from 'react-toastify'

export default function useDownloadAll(beatmapsetQueries: UseQueryResult<any, Error>[]) {
   const [progress, setProgress] = useState<null | number>(null)
   const [text, setText] = useState<null | string>(null)

   // download maps
   async function handleDownloadAll() {
      const zip = new JSZip()
      setProgress(0)

      const validQueries = beatmapsetQueries.filter((q) => q.data && q.data.beatmapsets.length > 0)
      let count = 0
      const downloadedFiles = await Promise.all(
         validQueries.map(async (q) => {
            const beatmapset: BeatmapSet = q.data?.beatmapsets[0]
            const filename = `${beatmapset.id} ${beatmapset.artist} - ${beatmapset.title}.osz`
            const blob = await getNoVideoAxios(beatmapset.id)
            count++
            setText(`Downloading... (${count}/${validQueries.length})`)
            setProgress(Math.max((count / validQueries.length) * 100 - 1, 0))
            return { filename, blob }
         }),
      )

      setText('Creating zip...')
      downloadedFiles.forEach(({ filename, blob }) => zip.file(filename, blob))
      const promise = zip
         .generateAsync({ type: 'blob' }, (metadata) => {
            setText(`Creating zip... (${Math.round(metadata.percent)}%)`)
         })
         .then((blob) => {
            download(blob, 'beatmaps.zip')
            setProgress(100)
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
      promise.then(() => {
         setText(null)
         setProgress(null)
         // if (isModalDownloadingVisible) {
         //    setIsModalDownloadingVisible(false)
         //    setIsModalDownloadedVisible(true)
         // }
      })
   }

   return { progress, text, handleDownloadAll }
}
