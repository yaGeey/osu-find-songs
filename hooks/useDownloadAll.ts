import { BeatmapSet } from '@/types/Osu'
import { download, getNoVideoAxios } from '@/utils/osuDownload'
import { UseQueryResult } from '@tanstack/react-query'
import JSZip from 'jszip'
import { useState } from 'react'
import { toast } from 'react-toastify'

export default function useDownloadAll(beatmapsetQueries: UseQueryResult<any, Error>[]) {
   const [progress, setProgress] = useState<null | number>(null)
   const [current, setCurrent] = useState<null | string>(null)

   // download maps
   function handleDownloadAll() {
      const zip = new JSZip()
      setProgress(0)
      beatmapsetQueries.forEach((q) => {
         if (!q.data || !q.data.beatmapsets.length) return
         const beatmapset: BeatmapSet = q.data?.beatmapsets[0]

         const filename = `${beatmapset.id} ${beatmapset.artist} - ${beatmapset.title}.osz`
         zip.file(filename, getNoVideoAxios(beatmapset.id))
      })
      const promise = zip
         .generateAsync({ type: 'blob' }, (metadata) => {
            setProgress(metadata.percent)
            setCurrent(metadata.currentFile)
         })
         .then((blob) => {
            download(blob, 'beatmaps.zip')
         })
         .catch((error) => {
            console.error('Download failed:', error)
            setProgress(-1)
         })

      toast.promise(promise, {
         success: 'Downloaded successfully',
         error: 'Download failed',
      })
      promise.then(() => {
         setCurrent(null)
         setProgress(null)
         // if (isModalDownloadingVisible) {
         //    setIsModalDownloadingVisible(false)
         //    setIsModalDownloadedVisible(true)
         // }
      })
   }

   return { progress, current, handleDownloadAll }
}
