'use client'
import { useState } from 'react'
import Image from 'next/image'
import { twMerge as tw } from 'tailwind-merge'

const links = [
   'https://i.imgur.com/puys3Ds.jpeg',
   'https://i.imgur.com/dtQYupf.png',
   'https://i.imgur.com/kA8hBvT.png',
   'https://i.imgur.com/7Ya0zny.jpeg',
]

export default function BgImage({ image, className }: { image?: string; brightness?: number; className?: string }) {
   const [isLoaded, setIsLoaded] = useState(false)

   return (
      <div className={tw('fixed top-0 left-0 w-full h-full -z-10 brightness-[.5]', className)}>
         <Image
            src={image || '/bg.svg'}
            alt="bg"
            fill
            className="object-cover"
            sizes="100vw"
            quality={100}
            onLoad={() => setIsLoaded(true)}
            suppressHydrationWarning
            priority
         />
         {!isLoaded && <div className="fixed top-0 left-0 w-full h-full bg-main-border"></div>}
      </div>
   )
}
