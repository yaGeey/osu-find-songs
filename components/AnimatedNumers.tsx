import { getMapsDownloadedCount } from '@/lib/telemetry'
import AnimatedNumber from './AnimatedNumber'

export async function MapsDownloaded() {
   const mapsDownloadedCount = await getMapsDownloadedCount()
   return (
      <span>
         <AnimatedNumber value={mapsDownloadedCount} /> maps downloaded
      </span>
   )
}

export async function PlaylistsCreated() {
   // const playlistsCreatedCount = await getPlaylistsCreatedCount()
   const playlistsCreatedCount = 223
   return (
      <span>
         <AnimatedNumber value={playlistsCreatedCount} /> playlists created
      </span>
   )
}
