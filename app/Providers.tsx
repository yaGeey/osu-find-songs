'use client'
import QueryProvider from './QueryProvider'
import { LocalBeatmapsContextProvider } from '@/contexts/SongContext'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorCallback from '@/components/ErrorFallback'
import { Tooltip } from 'react-tooltip'
import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import useBaseStore from '@/contexts/useBaseStore'
import BackgroundFetcher from '@/components/BackgroundFetcher'
import { NotifyHandle, ProgressNotify } from '@/components/state/HeaderError'

const LDShell = dynamic(() => import('./LDShell'), { ssr: false }) // ~750 KB of JS

export default function Providers({ children }: { children: React.ReactNode }) {
   const clientSideID =
      process.env.NODE_ENV === 'production'
         ? process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID!
         : process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID_TEST!

   const progressNotifyRef = useRef<NotifyHandle>(null)
   useEffect(() => {
      if (typeof window === 'undefined') return
      if (progressNotifyRef.current) useBaseStore.setState({ notifyRef: progressNotifyRef })
   }, [progressNotifyRef])

   const content = (
      <QueryProvider>
         <NuqsAdapter>
            <LocalBeatmapsContextProvider>
               <Tooltip
                  id="tooltip"
                  place="bottom"
                  style={{ fontSize: '13px', padding: '0 0.25rem', zIndex: 100000 }}
               />
               <ProgressNotify ref={progressNotifyRef} />
               <BackgroundFetcher />
               {children}
            </LocalBeatmapsContextProvider>
         </NuqsAdapter>
      </QueryProvider>
   )

   if (process.env.NODE_ENV === 'development') return content
   return (
      <ErrorBoundary FallbackComponent={ErrorCallback}>
         {content}
         <LDShell clientSideID={clientSideID} />
      </ErrorBoundary>
   )
}
