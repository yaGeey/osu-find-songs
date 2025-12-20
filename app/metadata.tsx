import type { Metadata } from 'next'
import { WebApplication, WithContext } from 'schema-dts'
const description =
   'Easily find songs on Spotify and YouTube. Instantly create a Spotify playlist with all your songs in one click. Discover beatmaps from any Spotify playlist and enhance your osu! experience.'
const title = 'osu! find songs – Search & Convert 🎵'
export const metadataObj: Metadata = {
   title,
   description,
   // prettier-ignore
   keywords: [
      // Core terms
      'osu!', 'osu', 'osu game', 'osu! beatmaps', 'beatmap',
      // Spotify integration
      'Spotify', 'Spotify playlist', 'osu to Spotify', 'Spotify to osu', 
      // Converters & tools
      'beatmap converter', 'osu playlist generator', 'osu playlist creator',
      'beatmap finder', 'beatmap downloader', 'osu songs finder',
      // Search terms
      'find osu songs', 'find beatmaps', 'search osu beatmaps',
      'discover osu music', 'osu music discovery',
      // Features
      'batch beatmap download', 'osu YouTube integration',
      'osu collection manager', 'osu! tools', 'osu utilities',
      // Categories
      'rhythm game', 'rhythm games', 'music game tools',
      'gaming music', 'music discovery', 'playlist creator',
   ],
   icons: { icon: '/icon.png' },
   openGraph: {
      title,
      description,
      images: [{ url: '/preview.png' }],
      locale: 'en_US',
   },
   twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://osu-find-songs.vercel.app/icon.png'],
   },
   robots: {
      follow: true,
      index: true,
      googleBot: {
         index: true,
         follow: true,
         'max-image-preview': 'large',
         'max-snippet': -1,
      },
   },
}

export function JsonLd() {
   const jsonLdData: WithContext<WebApplication> = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      url: 'https://osufindsongs.vercel.app',
      description,
      applicationCategory: 'MultimediaApplication',
      screenshot: 'https://osufindsongs.vercel.app/preview.png',
      featureList: [
         'Convert Spotify playlists to osu! beatmaps',
         'Scan osu! beatmaps and create Spotify playlists',
         'Advanced filtering and sorting options',
         'Batch download beatmaps',
         'YouTube integration for music videos',
      ],
      offers: {
         '@type': 'Offer',
         price: '0',
         priceCurrency: 'USD',
      },
      subjectOf: {
         '@type': 'VideoObject',
         name: 'ThunderBirdo featured osu! find songs in his video',
         contentUrl: 'https://www.youtube.com/watch?v=0uZ4RehxDO4',
      },
   }
   return (
      <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdData).replace(/</g, '\\u003c'),
         }}
      />
   )
}
