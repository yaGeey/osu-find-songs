import Footer from './Footer'
import icon from '@/public/icon.png'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
export default function Overlay() {
   return (
      <>
         <div className="text-white z-10 absolute top-0 w-full h-[70px] bg-main-dark-vivid/35 backdrop-blur-sm flex items-center justify-center">
            <Link href="/" className="flex gap-3 items-center group">
               <Image src={icon} alt="osufindsongs - tool for osu and spotify" className="size-10" placeholder="blur" />
               <h1 className="text-3xl font-medium tracking-tight group-hover:text-main-lightest transition-colors">
                  osufindsongs
               </h1>
            </Link>
         </div>
         <div className="text-white z-10 absolute bottom-0 w-full h-[70px] bg-main-dark-vivid/35 backdrop-blur-sm flex items-center justify-center">
            <Suspense>
               <Footer />
            </Suspense>
         </div>
      </>
   )
}
