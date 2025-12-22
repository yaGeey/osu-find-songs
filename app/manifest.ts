import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
   return {
      name: 'osufindsongs',
      short_name: 'osufindsongs',
      description: 'Create Spotify playlists and discover beatmaps from any playlist to enhance your osu! experience.',
      start_url: '/',
      display: 'standalone', // Це прибирає інтерфейс браузера
      background_color: '#733f3f', // Колір фону при завантаженні (темний)
      theme_color: '#eb9191', // Колір шапки браузера (можна взяти osu-pink або spotify-green)
      icons: [
         {
            src: '/icon.png', // Переконайся, що цей файл є в папці public
            sizes: '192x192',
            type: 'image/png',
         },
      ],
   }
}
