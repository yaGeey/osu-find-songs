import type { Metadata } from 'next'
import { WebApplication, WithContext } from 'schema-dts'

const description =
   'osufindsongs is the easiest way to find songs on Spotify and YouTube for osu!. Instantly create Spotify playlists and discover beatmaps from any playlist to enhance your osu! experience.'
const title = 'osufindsongs – find osu! songs & convert 🎵'
const url = 'https://osu.yageey.me'

export const metadataObj: Metadata = {
   metadataBase: new URL(url),
   title,
   description,
   applicationName: 'osufindsongs',
   authors: [{ name: 'yageey', url: 'https://yageey.me' }],
   creator: 'yageey',
   alternates: {
      canonical: '/',
   },
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
      images: [{ url: '/preview.png', alt: 'osufindsongs preview' }],
      locale: 'en_US',
      type: 'website',
      url,
   },
   twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/preview.png`],
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
      url,
      description,
      applicationCategory: 'MultimediaApplication',
      screenshot: `${url}/preview.png`,
      operatingSystem: 'Windows, macOS, Linux, Web',
      sameAs: ['https://github.com/yaGeey/osu-find-songs'],
      audience: {
         '@type': 'Audience',
         audienceType: 'osu! players, Rhythm game enthusiasts',
      },
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
      creator: {
         '@type': 'Person',
         name: 'yageey',
         url: ['https://yageey.me', 'https://github.com/yaGeey'],
      },
      subjectOf: [
         {
            '@type': 'VideoObject',
            name: "The top 15 most UNDERRATED Osu! addons (It get's insane!)",
            description:
               'Discover 15 game-changing Osu! addons, from map preview tools to custom hit circle generators. This video showcases essential community-made resources, including a replay analyzer and settings sharer.',
            thumbnailUrl: 'https://i.ytimg.com/vi/0uZ4RehxDO4/maxresdefault.jpg',
            uploadDate: '2025-07-11T17:13:53-07:00',
            contentUrl: 'https://www.youtube.com/watch?v=0uZ4RehxDO4&t=300s',
            embedUrl: 'https://www.youtube.com/embed/0uZ4RehxDO4',
            author: {
               '@type': 'Person',
               name: 'ThunderBirdo',
               url: 'https://www.youtube.com/@ThunderBirdo',
            },
         },
         // 2. Reddit Пост (Авторський анонс)
         {
            '@type': 'SocialMediaPosting',
            headline: 'I made a web app that allows users to find songs from their osu! folder on Spotify',
            url: 'https://www.reddit.com/r/osugame/comments/1jgntcz/i_made_a_web_app_that_allows_users_to_find_songs/',
            commentCount: 37,
            publisher: {
               '@type': 'Organization',
               name: 'Reddit',
            },
         },
         // 3. Reddit Пост (Update/Fix)
         {
            '@type': 'SocialMediaPosting',
            headline: 'I fixed a web app that allows users to find songs',
            url: 'https://www.reddit.com/r/osugame/comments/1m5ruu2/i_fixed_a_web_app_that_allows_users_to_find_songs/',
            commentCount: 16,
            publisher: {
               '@type': 'Organization',
               name: 'Reddit',
            },
         },
         // 4. Каталог osuck.net
         {
            '@type': 'WebPage',
            name: 'osu! find songs by ssable - osu! tools and resources',
            url: 'https://tools.osuck.net/tool/67df097dafb780368707339a',
            publisher: {
               '@type': 'Organization',
               name: 'osuck.net',
            },
         },
      ],
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
