'use client'
import { useState, useEffect } from 'react'
import BgImage from '../../../components/BgImage'
import { twMerge as tw } from 'tailwind-merge'

export default function DynamicBg({ src }: { src?: string }) {
   const [isSongBgVisible, setIsSongBgVisible] = useState(false)
   const [songBg, setSongBg] = useState<string | undefined>(undefined)
   useEffect(() => {
      if (src !== undefined) {
         if (songBg === undefined) {
            // null -> bg
            setIsSongBgVisible(true)
            setSongBg(src)
         } else {
            // bg1 -> bg2
            setIsSongBgVisible(false)
            setTimeout(() => {
               setSongBg(src)
               setIsSongBgVisible(true)
            }, 100)
         }
      } else {
         // bg -> null
         setIsSongBgVisible(false)
         setTimeout(() => setSongBg(undefined), 100)
      }
   }, [src])

   return (
      <>
         <BgImage />
         <BgImage image={songBg} className={tw('duration-100 transition-all', isSongBgVisible ? 'opacity-100' : 'opacity-0')} />
      </>
   )
}
