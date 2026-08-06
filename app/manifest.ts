import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
   return {
      name: 'osufindsongs',
      short_name: 'osufindsongs',
      description: 'Create Spotify playlists and discover beatmaps from any playlist to enhance your osu! experience.',
      start_url: '/',
      display: 'standalone',
      background_color: '#733f3f',
      theme_color: '#eb9191',
      icons: [
         {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
         },
      ],
   }
}
