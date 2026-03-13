'use client'

// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import { isServer, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { toast } from 'react-toastify'
import useBaseStore from '@/contexts/useBaseStore'

const displayError = (err: unknown, errMsg: string) => {
   console.error(err)
   toast.error(errMsg, { autoClose: 8000 })
   useBaseStore.getState().progressNotifyRef?.current?.blink('error', 4000)
}

const persister = createSyncStoragePersister({
   storage: typeof window !== 'undefined' ? window.localStorage : undefined,
})

function makeQueryClient() {
   return new QueryClient({
      defaultOptions: {
         queries: {
            gcTime: 1000 * 60 * 60 * 24, // Garbage collection timer
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: Infinity,
         },
      },
      queryCache: new QueryCache({
         onError: (error, query) => {
            displayError(
               error,
               (query.meta?.errMsg as string) ?? 'An error occurred while fetching data. Open console for details.',
            )
         },
      }),
      mutationCache: new MutationCache({
         onError: (error, _variables, _context, mutation) => {
            displayError(
               error,
               (mutation.meta?.errMsg as string) ?? 'An error occurred while performing the action. Open console for details.',
            )
         },
      }),
   })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
   if (isServer) {
      // Server: always make a new query client
      return makeQueryClient()
   } else {
      // Browser: make a new query client if we don't already have one
      // This is very important, so we don't re-make a new client if React
      // suspends during the initial render. This may not be needed if we
      // have a suspense boundary BELOW the creation of the query client
      if (!browserQueryClient) browserQueryClient = makeQueryClient()
      return browserQueryClient
   }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
   // NOTE: Avoid useState when initializing the query client if you don't
   //       have a suspense boundary between this and the code that may
   //       suspend because React will throw away the client on the initial
   //       render if it suspends and there is no boundary
   const queryClient = getQueryClient()
   return (
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
         {children}
         {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </PersistQueryClientProvider>
   )
}
