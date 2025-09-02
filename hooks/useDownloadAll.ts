import { BeatmapSet } from '@/types/Osu'
import { getWindowsFriendlyLocalTime } from '@/utils/dates'
import { download, getNoVideoAxios, getNoVideoParallel } from '@/utils/osuDownload'
import JSZip from 'jszip'
import { useState } from 'react'
import { toast } from 'react-toastify'

export default function useDownloadAll(maps: BeatmapSet[][]) {
   const [progress, setProgress] = useState<null | number>(null)
   const [text, setText] = useState<null | string>(null)

   // download maps
   async function handleDownloadAll() {
      const zip = new JSZip()
      setProgress(0)
      let count = 0

      const valid = maps.filter((set) => set.length)
      const downloadedFiles = await Promise.all(
         valid.map(async (set) => {
            const b: BeatmapSet = set[0]
            const filename = `${b.id} ${b.artist} - ${b.title}.osz`
            // TODO add paralleling
            const blob = await getNoVideoAxios(b.id)
            count++
            setText(`Downloading... (${count}/${valid.length})`)
            setProgress((count / valid.length) * 99)
            console.log(`Downloaded ${filename}`)
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
