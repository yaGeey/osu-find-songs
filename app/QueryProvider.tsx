'use client';

// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import { isServer, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

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
   });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
   if (isServer) {
      // Server: always make a new query client
      return makeQueryClient();
   } else {
      // Browser: make a new query client if we don't already have one
      // This is very important, so we don't re-make a new client if React
      // suspends during the initial render. This may not be needed if we
      // have a suspense boundary BELOW the creation of the query client
      if (!browserQueryClient) browserQueryClient = makeQueryClient();
      return browserQueryClient;
   }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
   // NOTE: Avoid useState when initializing the query client if you don't
   //       have a suspense boundary between this and the code that may
   //       suspend because React will throw away the client on the initial
   //       render if it suspends and there is no boundary
   const queryClient = getQueryClient();
   const persister = createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
   });

   return (
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
         {/* <ErrorBoundary
            onError={(error, info) => { sendTgMessage(error + (info.componentStack || '') + info.digest); }}
            fallbackRender={({ error, resetErrorBoundary }) => (
               <div>
                  <p>Something went wrong!</p>
                  <pre>{error.message}</pre>
                  <button onClick={resetErrorBoundary}>Try again</button>
               </div>
            )}
         > */}
         {children}
         {/* </ErrorBoundary> */}
         <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
   );
}
