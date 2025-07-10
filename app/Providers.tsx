'use client'
import QueryProvider from './QueryProvider'
import { SongContextProvider } from '@/contexts/SongContext'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorCallback from '@/components/ErrorFallback'

export default function Providers({ children }: { children: React.ReactNode }) {
   const content = (
      <QueryProvider>
         <NuqsAdapter>
            <SongContextProvider>{children}</SongContextProvider>
         </NuqsAdapter>
      </QueryProvider>
   )

   if (process.env.NODE_ENV === 'development') {
      return content
   }
   return (
      <ErrorBoundary FallbackComponent={ErrorCallback}>
         <QueryProvider>
            <NuqsAdapter>
               <SongContextProvider>{children}</SongContextProvider>
            </NuqsAdapter>
         </QueryProvider>
      </ErrorBoundary>
   )
}
