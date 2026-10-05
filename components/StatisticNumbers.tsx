import { getMapsDownloadedCount, getPlaylistsCreatedCount } from '@/lib/actions/telemetry'
import AnimatedNumber from './AnimatedNumber'

export async function MapsDownloaded({ label = 'maps downloaded' }: { label?: string } = {}) {
   const mapsDownloadedCount = await getMapsDownloadedCount()
   return <AnimatedNumber value={mapsDownloadedCount} label={label} />
}

export async function PlaylistsCreated({ label = 'playlists created' }: { label?: string } = {}) {
   const playlistsCreatedCount = await getPlaylistsCreatedCount()
   return <AnimatedNumber value={playlistsCreatedCount} label={label} />
}
