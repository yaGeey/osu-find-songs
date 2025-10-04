import BgImage from './BgImage'
import { Button } from './buttons/Buttons'
import Image from 'next/image'

export default function ErrorCallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
   return (
      <div className="flex items-center h-screen">
         <BgImage />
         <div className="bg-main-light flex w-[750px] rounded-xl shadow-lg mx-auto overflow-hidden border-4 border-main-border">
            <Image src="/cat.gif" width={350} height={350} alt="404" />
            <div className="flex flex-col justify-center items-center flex-grow">
               <h2 className="text-xl font-semibold">What the....</h2>
               <p className="text-lg font-semibold">Something went wrong</p>
               <pre>This cat is saying "sorry"</pre>
               <Button onClick={resetErrorBoundary} className="bg-main-dark mt-5">
                  Try again
               </Button>
            </div>
         </div>
      </div>
   )
}
