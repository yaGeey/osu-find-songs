import type { Metadata } from 'next'
import './globals.css'
import Providers from './Providers'
import Script from 'next/script'

// This ensures that the icon CSS is loaded immediately before attempting to render icons
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
// import MobileDeviceCheck from '@/components/MobileDeviceCheck'
import { Suspense } from 'react'
import { metadataObj, JsonLd } from './metadata'
import InitialLoadPage from '@/components/state/InitialLoadPage'
// Prevent fontawesome from dynamically adding its css since we did it manually above
config.autoAddCss = false

export const metadata: Metadata = metadataObj

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
   return (
      <html lang="en">
         <head>
            <JsonLd />
            <Script id="error-handler" strategy="beforeInteractive">
               {`
                  window.addEventListener('error', function(event) {
                     // Suppress errors from third-party libraries that might break in bots/crawlers
                     if (event.error && event.error.message && 
                         (event.error.message.includes('getAttribute') || 
                          event.error.message.includes('is not a function'))) {
                        event.preventDefault();
                        return false;
                     }
                  }, true);
               `}
            </Script>
         </head>
         <body className="antialiased font-inter selection:bg-main-white selection:text-main-border">
            <Suspense fallback={<InitialLoadPage />}>
               <Providers>
                  {/* <MobileDeviceCheck /> */}
                  {children}
               </Providers>
            </Suspense>
         </body>
      </html>
   )
}
