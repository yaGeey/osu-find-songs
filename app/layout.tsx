import type { Metadata } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import './globals.css'
import Providers from './Providers'
import { Analytics } from '@vercel/analytics/next'
import { HighlightInit } from '@highlight-run/next/client'

// This ensures that the icon CSS is loaded immediately before attempting to render icons
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import MobileDeviceCheck from '@/components/MobileDeviceCheck'
import Telemetry from '@/components/Telemetry'
// Prevent fontawesome from dynamically adding its css since we did it manually above
config.autoAddCss = false

const inter = Inter({
   variable: '--font-inter',
   subsets: ['latin'],
})
const interTight = Inter_Tight({
   variable: '--font-inter-tight',
   subsets: ['latin'],
})

export const metadata: Metadata = {
   title: 'osu! find songs – Search & Convert 🎵',
   description:
      'Easily find songs on Spotify and YouTube. Instantly create a Spotify playlist with all your songs in one click. Discover beatmaps from any Spotify playlist and enhance your osu! experience.',
   icons: { icon: '/icon.png' },
   openGraph: {
      title: 'osu! find songs – Search & Convert 🎵',
      description:
         'Easily find songs on Spotify and YouTube. Instantly create a Spotify playlist with all your songs in one click. Discover beatmaps from any Spotify playlist and enhance your osu! experience.',
      images: [{ url: '/icon.png' }],
      locale: 'en_US',
   },
   twitter: {
      card: 'summary_large_image',
      title: 'osu! find songs – Search & Convert 🎵',
      description:
         'Easily find songs on Spotify and YouTube. Instantly create a Spotify playlist with all your songs in one click. Discover beatmaps from any Spotify playlist and enhance your osu! experience.',
      images: ['https://osu-find-songs.vercel.app/icon.png'],
   },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
   return (
      <>
         <HighlightInit
            excludedHostnames={['localhost']}
            projectId={process.env.HIGHLIGHT_PROJECT_ID!}
            serviceName={process.env.HIGHLIGHT_APP_NAME!}
            tracingOrigins
            networkRecording={{
               enabled: true,
               recordHeadersAndBody: true,
               urlBlocklist: [],
            }}
         />
         <html lang="en">
            {process.env.NODE_ENV === 'development' && (
               <head>
                  <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
               </head>
            )}
            <body
               className={`${inter.variable} ${interTight.variable} antialiased font-inter selection:bg-main-white selection:text-main-border`}
            >
               <Providers>
                  <MobileDeviceCheck />
                  <Telemetry />
                  {children}
               </Providers>
               {process.env.NODE_ENV !== 'development' && <Analytics />}
            </body>
         </html>
      </>
   )
}