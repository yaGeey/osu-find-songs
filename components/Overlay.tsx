import Footer from './Footer'
import icon from '@/public/icon.png'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { BannersContainer } from './BannersContainer'
export default function Overlay() {
   return (
      <>
         <div className="text-white z-10 absolute top-0 w-full h-[70px] 3xl:h-[90px] 4xl:h-[110px] 5xl:h-[130px] flex items-center justify-center gap-8 3xl:gap-12 4xl:gap-16 px-5 3xl:px-8 4xl:px-12 border-b-4 border-main-border">
            <div className="absolute left-0 top-0 w-full h-full bg-triangles -z-1 [--color-dialog:var(--color-main-dark-vivid)] brightness-75" />
            <Link href="/" className="flex gap-4 3xl:gap-6 4xl:gap-8 items-end group">
               <span className="text-main-white/70 md:block hidden 3xl:text-lg 4xl:text-xl 5xl:text-2xl">turn beatmaps into playlists</span>
               <h1 className="flex items-center gap-2 3xl:gap-3 4xl:gap-4 text-3xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl font-medium tracking-tight group-hover:text-main-lightest transition-colors">
                  <Image
                     src={icon}
                     alt="osufindsongs - tool for osu and spotify"
                     className="size-10 3xl:size-12 4xl:size-14 5xl:size-16"
                     placeholder="blur"
                  />
                  osufindsongs
               </h1>
               <span className="text-main-white/70 md:block hidden 3xl:text-lg 4xl:text-xl 5xl:text-2xl">turn playlists into beatmaps</span>
            </Link>
            <Suspense>
               <BannersContainer />
            </Suspense>
         </div>
         <div className="text-white z-10 absolute bottom-0 w-full h-[70px] 3xl:h-[90px] 4xl:h-[110px] 5xl:h-[130px] border-t-4 border-main-border flex items-center justify-center px-4 3xl:px-8">
            <div className="absolute left-0 top-0 w-full h-full bg-triangles -z-1 [--color-dialog:var(--color-main-dark-vivid)] brightness-75" />
            <Suspense>
               <Footer />
            </Suspense>
         </div>
      </>
   )
}
