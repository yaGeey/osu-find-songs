import { useEffect } from 'react'
import { Button } from './buttons/Buttons'
import Image from 'next/image'
import Link from 'next/link'
import { sendTelegramError } from '@/lib/notify'
import cat from '@/public/cat.avif'

export default function ErrorCallback({
   error,
   resetErrorBoundary,
}: {
   error: Error & { digest?: string }
   resetErrorBoundary: () => void
}) {
   useEffect(() => {
      console.error(error)
      if (process.env.NODE_ENV !== 'development') {
         sendTelegramError(`
            🚨 <b>App Error</b>
            <b>URL:</b> ${window.location.href}
            <b>Message:</b> ${error.message}
            <pre><code class="language-json">${JSON.stringify(error, null, 2)}</code></pre>
         `)
      }
   }, [error])

   return (
      <div className="flex items-center h-screen">
         <div className="bg-main-light flex w-[750px] rounded-xl shadow-lg mx-auto overflow-hidden border-4 border-main-border">
            <Image src={cat} unoptimized width={350} height={350} alt="404" />
            <div className="flex flex-col justify-center items-center flex-grow">
               <h2 className="text-xl font-semibold">What the....</h2>
               <p className="text-lg font-semibold">Something went wrong</p>
               <pre>I am really sorry, as well as this cat</pre>
               <Button onClick={resetErrorBoundary} className="mt-5">
                  Reload the page
               </Button>
               <Link href="/">
                  <a className="mt-3 selected hover:underline">Go back to Home</a>
               </Link>
            </div>
         </div>
      </div>
   )
}
