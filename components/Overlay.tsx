import Footer from './Footer'
import icon from '@/public/icon.png'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import Banners from './Banners'
import { getActiveBanners } from '@/lib/actions/telemetry'
export default function Overlay() {
   return (
      <>
         <div className="text-white z-10 absolute top-0 w-full h-[70px] bg-main-dark-vivid/45 backdrop-blur-sm flex items-center justify-center gap-8 px-5">
            <Link href="/" className="flex gap-3 items-center group">
               <Image src={icon} alt="osufindsongs - tool for osu and spotify" className="size-10" placeholder="blur" />
               <h1 className="text-3xl font-medium tracking-tight group-hover:text-main-lightest transition-colors">
                  osufindsongs
               </h1>
            </Link>
            <Suspense>
               <BannersContainer />
            </Suspense>
         </div>
         <div className="text-white z-10 absolute bottom-0 w-full h-[70px] bg-main-dark-vivid/45 backdrop-blur-sm flex items-center justify-center">
            <Suspense>
               <Footer />
            </Suspense>
         </div>
      </>
   )
}

async function BannersContainer() {
   const res = await getActiveBanners()
   if (!res.length) return null
   return (
      <div className="flex-1 place-items-end">
         <Banners banners={res} />
      </div>
   )
}
