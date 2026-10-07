import Footer from './Footer'
import icon from '@/public/icon.png'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { BannersContainer } from './BannersContainer'
export default function Overlay() {
   return (
      <>
         <div className="text-white z-10 absolute top-0 w-full h-[70px] flex items-center justify-center gap-8 px-5 border-b-4 border-main-border">
            <div className="absolute left-0 top-0 w-full h-full bg-triangles -z-1 [--color-dialog:var(--color-main-dark-vivid)] brightness-75" />
            <Link href="/" className="flex gap-4 items-end group">
               <span className="text-main-white/70 md:block hidden">turn beatmaps into playlists</span>
               <h1 className="flex items-center gap-2 text-3xl font-medium tracking-tight group-hover:text-main-lightest transition-colors">
                  <Image
                     src={icon}
                     alt="osufindsongs - tool for osu and spotify"
                     className="size-10"
                     placeholder="blur"
                  />
                  osufindsongs
               </h1>
               <span className="text-main-white/70 md:block hidden">turn playlists into beatmaps</span>
            </Link>
            <Suspense>
               <BannersContainer />
            </Suspense>
         </div>
         <div className="text-white z-10 absolute bottom-0 w-full h-[70px] border-t-4 border-main-border flex items-center justify-center">
            <div className="absolute left-0 top-0 w-full h-full bg-triangles -z-1 [--color-dialog:var(--color-main-dark-vivid)] brightness-75" />
            <Suspense>
               <Footer />
            </Suspense>
         </div>
      </>
   )
}
