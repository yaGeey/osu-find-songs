import type { Metadata } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import './globals.css'
import Providers from './Providers'
import { Analytics } from '@vercel/analytics/next'
import { HighlightInit } from '@highlight-run/next/client'
import { GoogleAnalytics } from '@next/third-parties/google'
import Script from 'next/script'

// This ensures that the icon CSS is loaded immediately before attempting to render icons
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
// import MobileDeviceCheck from '@/components/MobileDeviceCheck'
import Telemetry from '@/components/Telemetry'
import { Suspense } from 'react'
import { metadataObj, JsonLd } from './metadata'
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

export const metadata: Metadata = metadataObj

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
   const isDev = process.env.NODE_ENV === 'development'
   return (
      <html lang="en">
         <head>
            <JsonLd />
         </head>
         <body
            className={`${inter.variable} ${interTight.variable} antialiased font-inter selection:bg-main-white selection:text-main-border`}
         >
            {isDev && <Script src="https://unpkg.com/react-scan/dist/auto.global.js" strategy="beforeInteractive" />}
            {!isDev && (
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
            )}
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
               <Providers>
                  {/* <MobileDeviceCheck /> */}
                  <Telemetry />
                  {children}
               </Providers>
            </Suspense>
            {!isDev && <Analytics />}
            {!isDev && <GoogleAnalytics gaId={process.env.GA_ID!} />}
         </body>
      </html>
   )
}
