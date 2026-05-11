import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
   return {
      name: 'osu-lastfm',
      short_name: 'osu-lastfm',
      description: 'Find osu! beatmaps from public Last.fm top tracks.',
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
