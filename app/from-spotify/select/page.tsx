'use client'
import BgImage from '@/components/BgImage'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import Footer from '@/components/Footer'
import { twMerge as tw } from 'tailwind-merge'

export default function SelectPage() {
   const [isLoading, setIsLoading] = useState(false)
   const [isError, setIsError] = useState(false)
   const inputRef = useRef<HTMLInputElement>(null)
   const router = useRouter()

   function handleClick(url: string) {
      setIsLoading(true)
      const parts = url.split('/')
      const id = parts[parts.length - 1].split('?')[0]
      // @ts-ignore
      router.push('/from-spotify/' + id)
   }

   return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white">
         <BgImage />
         <div className="flex flex-col justify-center items-center flex-1 text-nowrap">
            <h1 className="text-4xl tracking-tight font-semibold mb-3">Select a public playlist</h1>
            <h3 className="text-lg text-white/60">*NOT Album, Daily, Private playlist</h3>
            <h2 className="text-xl mt-7 mb-3">Right-click the playlist → Share → Copy link to playlist</h2>

            <div className="relative w-full">
               <input
                  placeholder="Spotify playlist link"
                  pattern="https://open.spotify.com/playlist/.*"
                  onChange={(e) => {
                     if (e.target.value) {
                        if (e.target.checkValidity()) {
                           handleClick(e.target.value)
                        } else setIsError(true)
                     } else setIsError(false)
                  }}
                  disabled={isLoading}
                  ref={inputRef}
                  className="bg-gray-100 disabled:border-success hover:brightness-115 text-black border-3 w-full border-main rounded-lg pl-2 py-2 pr-8 [&:not(:placeholder-shown)]:bg-gray-200 valid:[&:not(:placeholder-shown)]:border-success invalid:[&:not(:placeholder-shown)]:border-error transition-all outline-0"
               ></input>
               <FontAwesomeIcon
                  icon={faSpotify}
                  className="absolute top-1/2 transform -translate-y-1/2 right-2 text-lg text-black/80"
               />
            </div>
            <span className={tw('text-left w-full ml-2 text-success -mt-0.5', !isLoading && 'hidden')}>Redirecting..</span>
            <span className={tw('text-left w-full ml-2 text-error -mt-0.5', !isError && 'invisible')}>Invalid link</span>
         </div>
         <Footer />
      </div>
   )
}
