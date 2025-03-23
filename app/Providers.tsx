'use client'
import QueryProvider from "./QueryProvider";
import { SongContextProvider } from "@/contexts/SongContext";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ErrorBoundary } from "react-error-boundary";
import ErrorCallback from "@/components/ErrorFallback";

export default function Providers({ children }: { children: React.ReactNode }) {
   return (
      <ErrorBoundary FallbackComponent={ErrorCallback}>
         <QueryProvider>
            <NuqsAdapter>
               <SongContextProvider>
                  {children}
               </SongContextProvider>
            </NuqsAdapter>
         </QueryProvider>
      </ErrorBoundary>
   )
}
