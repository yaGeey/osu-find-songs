'use client'
import QueryProvider from "./QueryProvider";
import { SongContextProvider } from "@/contexts/SongContext";
// import { SessionProvider } from 'next-auth/react'; // In case we want to use it CLIENT page (we better not use client pages)
// import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function Providers({ children }: { children: React.ReactNode }) {
   return (
      <QueryProvider>
         {/* <SessionProvider> */}
         {/* <NuqsAdapter> */}
            <SongContextProvider>
               {children}
            </SongContextProvider>
         {/* </NuqsAdapter> */}
         {/* </SessionProvider> */}
      </QueryProvider>
   )
}
