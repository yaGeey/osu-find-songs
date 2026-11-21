import { BeatmapSet } from '@/types/Osu'
import { useState } from 'react'
import { toast } from 'react-toastify'
import sortFn from '@/app/from-spotify/[playlistId]/_utils/sortBeatmaps'
import RateLimitManager from '@/lib/limiter/RateLimitManager'
import { sendMapDownloadTelemetry } from '@/lib/actions/telemetry'
import useSessionId from '../../../hooks/useSessionId'
import { useQueryClient } from '@tanstack/react-query'
import { fetchBeatmapWithFallback, download, sanitizeFilename, BANNED_STATUSES } from '../osuDownload'
import { getWindowsFriendlyLocalTime } from '@/utils/format'

const README_TEXT = `HOW TO INSTALL (bulk, no need to click each file)
Do NOT extract the .osz files themselves - they go into the game as-is.

--- osu! stable ---
1. Extract this zip so the .osz files are in your Songs folder:
   %localappdata%/osu!/Songs/  (or osu! Settings -> Open osu! folder -> Songs)
2. Open song select and press F5 (or restart osu!).
3. Done.

--- osu! lazer ---
1. Extract this zip anywhere.
2. Select all .osz files (Ctrl+A in folder) and drag & drop them onto the osu! window.
3. Wait for the import notification - done.`

export default function useDownloadAll(maps: BeatmapSet[][], sortQuery: string = 'relevance_asc') {
   const [progress, setProgress] = useState<null | number>(null)
   const [text, setText] = useState<null | string>(null)
   const manager = RateLimitManager.getInstance('downloadAllQueue')
   const { id: sessionId } = useSessionId()
   const queryClient = useQueryClient()

   // download maps
   async function handleDownloadAll() {
      const { default: JSZip } = await import('jszip') // ~100 KB
      const zip = new JSZip()
      setProgress(0)
      let count = 0

      const validMaps = maps
         .filter((set) => set.length)
         .map((set) => [...set].sort(sortFn(sortQuery))[0])
         .filter((b) => !BANNED_STATUSES.includes(b.status))

      const tasks = validMaps.map((b) => async () => {
         const blob = await fetchBeatmapWithFallback({ id: b.id, video: false, onlyNoVideo: !b.video, queryClient })
         const filename = sanitizeFilename(`${b.id} ${b.artist} - ${b.title}.osz`)

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
      if (downloadedFiles.length) zip.file('_README.txt', README_TEXT)

      zip.generateAsync({ type: 'blob' }, (metadata) => {
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
   }

   return { progress, text, handleDownloadAll }
}
