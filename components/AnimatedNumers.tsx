import { getMapsDownloadedCount, getPlaylistsCreatedCount } from '@/lib/telemetry'
import AnimatedNumber from './AnimatedNumber'

export async function MapsDownloaded() {
   const mapsDownloadedCount = await getMapsDownloadedCount()
   return <AnimatedNumber value={mapsDownloadedCount} label="maps downloaded" />
}

export async function PlaylistsCreated() {
   const playlistsCreatedCount = await getPlaylistsCreatedCount()
   return <AnimatedNumber value={playlistsCreatedCount} label="playlists created" />
}
