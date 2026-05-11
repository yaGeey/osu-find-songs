'use client'
import QueryProvider from './QueryProvider'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorCallback from '@/components/ErrorFallback'
import { Tooltip } from 'react-tooltip'
import { useEffect, useRef } from 'react'
import ProgressNotify, { ProgressNotifyHandle } from '@/components/state/ProgressNotify'
import useBaseStore from '@/contexts/useBaseStore'
import BackgroundFetcher from '@/components/BackgroundFetcher'

export default function Providers({ children }: { children: React.ReactNode }) {
   const progressNotifyRef = useRef<ProgressNotifyHandle>(null)
   useEffect(() => {
      if (typeof window === 'undefined') return
      if (progressNotifyRef.current) useBaseStore.setState({ progressNotifyRef })
   }, [progressNotifyRef])

   const content = (
      <QueryProvider>
         <NuqsAdapter>
            <Tooltip id="tooltip" place="bottom" style={{ fontSize: '13px', padding: '0 0.25rem', zIndex: 100000 }} />
            <ProgressNotify ref={progressNotifyRef} />
            <BackgroundFetcher />
            {children}
         </NuqsAdapter>
      </QueryProvider>
   )

   return <ErrorBoundary FallbackComponent={ErrorCallback}>{content}</ErrorBoundary>
}
