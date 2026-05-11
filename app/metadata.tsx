import { Metadata } from 'next'
import { SoftwareApplication, WithContext } from 'schema-dts'
import { repositoryUrl, siteUrl } from '@/lib/site'

const description =
   'osu-lastfm turns a public Last.fm profile into osu! beatmap search results. Enter a username, choose a top-track period, filter maps, and download beatmaps.'
const title = 'osu-lastfm - find osu! beatmaps from Last.fm'

export const metadataObj: Metadata = {
   title,
   description,
   applicationName: 'osu-lastfm',
   metadataBase: new URL(siteUrl),
   alternates: {
      canonical: siteUrl,
   },
   keywords: [
      'osu!',
      'osu',
      'Last.fm',
      'Lastfm',
      'beatmaps',
      'beatmap finder',
      'osu beatmap downloader',
      'music discovery',
      'rhythm game tools',
   ],
   openGraph: {
      type: 'website',
      url: siteUrl,
      title,
      description,
      siteName: 'osu-lastfm',
      images: [{ url: '/icon.png', alt: 'osu-lastfm icon' }],
   },
   twitter: {
      card: 'summary',
      title,
      description,
      images: ['/icon.png'],
   },
   robots: {
      index: true,
      follow: true,
   },
}

export function JsonLd() {
   const jsonLd: WithContext<SoftwareApplication> = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'osu-lastfm',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web',
      description,
      url: siteUrl,
      sameAs: [repositoryUrl],
      offers: {
         '@type': 'Offer',
         price: '0',
         priceCurrency: 'USD',
      },
      featureList: ['Last.fm top tracks to osu! beatmap search', 'Beatmap filtering', 'Batch beatmap download'],
   }

   return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
