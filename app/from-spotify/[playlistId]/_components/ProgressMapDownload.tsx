import Progress from '@/components/state/Progress'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import { formatBytes } from '@/utils/numbers'

export default function ProgressMapDownload() {
   const { pending } = useMapDownloadStore()
   const bytesDownloaded = Object.values(pending).reduce((acc, cur) => acc + (cur.downloadedBytes || 0), 0)
   const bytesTotal = Object.values(pending).reduce((acc, cur) => acc + (cur.totalBytes || 0), 0)
   return (
      <Progress isVisible={!!Object.values(pending).length} value={(bytesDownloaded / bytesTotal) * 100 || 0}>
         {Object.values(pending).map(
            (p, id) =>
               p.downloadedBytes &&
               p.totalBytes && (
                  <p key={id}>
                     {p.filename} ({formatBytes(p.downloadedBytes)}/{formatBytes(p.totalBytes)} MB)
                  </p>
               ),
         )}
      </Progress>
   )
}
