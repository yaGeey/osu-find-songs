import { useEffect } from 'react'
import { Button } from './buttons/Buttons'
import Image from 'next/image'
import { sendUnknownError } from '@/lib/errorHandling'
import ExternalLink from './ExternalLink'

export default function ErrorCallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
   const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error (non-Error exception)'

   useEffect(() => {
      console.error(error)
      if (process.env.NODE_ENV !== 'development') sendUnknownError(error, 'ERROR_BOUNDARY')
   }, [error])

   return (
      <div className="flex items-center min-h-screen p-4">
         <div className="bg-main-light flex w-[900px] rounded-xl shadow-lg mx-auto overflow-hidden border-4 border-main-border max-md:flex-col max-md:w-full">
            <Image
               src="/cat.avif"
               unoptimized
               width={350}
               height={350}
               alt="Error cat"
               className="max-md:w-full max-md:h-[220px] object-cover"
               priority
            />
            <div className="flex flex-col justify-center items-start gap-2 flex-grow p-6">
               <h2 className="text-2xl font-semibold">Something went wrong :(</h2>
               <p className="text-sm opacity-90">
                  You can report this on GitHub, or just know that I already received this error and will fix it as soon as
                  possible.
               </p>

               <div className="w-full mt-1 p-3 rounded-md bg-main-lightest border border-main-border/70">
                  <p className="text-xs font-semibold opacity-70">Error details</p>
                  <p className="text-sm break-words">{errorMessage}</p>
               </div>

               <div className="mt-3 w-full flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                     <Button onClick={resetErrorBoundary}>Reload the page</Button>
                     <Button onClick={() => window.location.assign('/')}>Go to Home</Button>
                  </div>
                  <ExternalLink href="https://github.com/yaGeey/osu-find-songs/issues">Report on GitHub</ExternalLink>
               </div>
            </div>
         </div>
      </div>
   )
}
