'use client'
import QueryProvider from './QueryProvider'
import { SongContextProvider } from '@/contexts/SongContext'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorCallback from '@/components/ErrorFallback'
import { Tooltip } from 'react-tooltip'
import { useEffect, useRef } from 'react'
import { getInternalTokens } from '@/lib/spotify/innerApi'
import useUserListener from '@/hooks/useUserListener'
import { LDProvider } from 'launchdarkly-react-client-sdk'
import Observability from '@launchdarkly/observability'
import SessionReplay from '@launchdarkly/session-replay'

export default function Providers({ children }: { children: React.ReactNode }) {
   const hasRunInitialFetch = useRef(false)
   useEffect(() => {
      const fetch = async () => await getInternalTokens()
      if (!hasRunInitialFetch.current) {
         fetch() // let error throw app
         hasRunInitialFetch.current = true
      }
   }, [])

   useUserListener()

   const clientSideID =
      process.env.NODE_ENV === 'production'
         ? process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID!
         : process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID_TEST!

   const content = (
      <QueryProvider>
         <LDProvider
            clientSideID={clientSideID}
            options={{
               bootstrap: 'localStorage',
               plugins: [
                  new Observability({
                     tracingOrigins: true,
                     networkRecording: {
                        enabled: true,
                        recordHeadersAndBody: true,
                     },
                     environment: process.env.NODE_ENV,
                     backendUrl: 'https://pub-ld.yageey.me',
                     otel: { otlpEndpoint: 'https://otel-ld.yageey.me' },
                     version: process.env.NEXT_PUBLIC_VERCEL_GITHUB_COMMIT_SHA!,
                     serviceName: 'client',
                  }),
                  new SessionReplay({
                     privacySetting: 'none',
                     version: process.env.NEXT_PUBLIC_VERCEL_GITHUB_COMMIT_SHA!,
                     serviceName: 'client',
                     environment: process.env.NODE_ENV,
                     backendUrl: 'https://pub-ld.yageey.me',
                     tracingOrigins: true,
                     inlineImages: false,
                  }),
               ],
               // logger: basicLogger({level: 'warn'})
            }}
         >
            <NuqsAdapter>
               <SongContextProvider>
                  <Tooltip id="tooltip" place="bottom" style={{ fontSize: '13px', padding: '0 0.25rem', zIndex: 100000 }} />
                  {children}
               </SongContextProvider>
            </NuqsAdapter>
         </LDProvider>
      </QueryProvider>
   )

   if (process.env.NODE_ENV === 'development') return content
   return <ErrorBoundary FallbackComponent={ErrorCallback}>{content}</ErrorBoundary>
}
