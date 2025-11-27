import BgImage from './BgImage'
import { Button } from './buttons/Buttons'
import Image from 'next/image'
import ExternalLink from './ExternalLink'

export default function ErrorCallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
   console.log(error)
   return (
      <div className="flex items-center h-screen">
         <BgImage />
         <div className="bg-main-light flex w-[750px] rounded-xl shadow-lg mx-auto overflow-hidden border-4 border-main-border">
            <Image src="/cat.gif" width={350} height={350} alt="404" />
            <div className="flex flex-col justify-center items-center flex-grow">
               <h2 className="text-xl font-semibold">What the....</h2>
               <p className="text-lg font-semibold">Something went wrong</p>
               <p>
                  Please open{' '}
                  <ExternalLink href="https://github.com/yaGeey/osu-find-songs/issues">an issue on GitHub</ExternalLink> and
                  include the console error log (F12) if you want to help solve this.
               </p>
               <Button onClick={resetErrorBoundary} className="mt-5">
                  Try reloading the page
               </Button>
            </div>
         </div>
      </div>
   )
}
