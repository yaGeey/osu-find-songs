'use client'
import QueryProvider from './QueryProvider'
import { SongContextProvider } from '@/contexts/SongContext'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorCallback from '@/components/ErrorFallback'
import { Tooltip } from 'react-tooltip'
import { useEffect, useRef } from 'react'
import { getInternalTokens } from '@/lib/spotify/innerApi'

export default function Providers({ children }: { children: React.ReactNode }) {
   const hasRunInitialFetch = useRef(false)
   useEffect(() => {
      const fetch = async () => {
         const tokens = await getInternalTokens()
         console.log(tokens)
      }
      if (!hasRunInitialFetch.current) {
         fetch() // let error throw app
         hasRunInitialFetch.current = true
      }
   }, [])

   const content = (
      <QueryProvider>
         <NuqsAdapter>
            <SongContextProvider>
               <Tooltip id="tooltip" place="bottom" style={{ fontSize: '13px', padding: '0 0.25rem', zIndex: 100000 }} />
               {children}
            </SongContextProvider>
         </NuqsAdapter>
      </QueryProvider>
   )

   if (process.env.NODE_ENV === 'development') return content
   return <ErrorBoundary FallbackComponent={ErrorCallback}>{content}</ErrorBoundary>
}
