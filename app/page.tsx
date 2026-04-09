import Link from 'next/link'
import Image from 'next/image'
import './page.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { Suspense } from 'react'
import { MapsDownloaded, PlaylistsCreated } from '@/components/AnimatedNumers'
import Overlay from '@/components/Overlay'

export default async function LandingPage() {
   return (
      <main className="relative grid grid-cols-2 max-sm:grid-cols-1 h-screen w-screen text-white">
         <Overlay />
         <Link
            href="/from-osu/select"
            className="relative overflow-hidden flex items-center justify-center group"
            transitionTypes={['nav-forward']}
         >
            <Image
               src="/fo2.webp"
               alt="fo"
               fill
               priority
               className="object-cover object-right blur-[2px] brightness-25 group-hover:scale-102 transition-[scale] ease-in"
            />
            <div className="absolute grid items-center text-center gap-7 font-medium group">
               <div className="grid gap-2">
                  {/* drop-shadow(0_0_8px_rgba(255,255,255,0.3))_ */}
                  <h2 className="text-4xl font-semibold tracking-tight broken-light-title">osu! to Spotify</h2>
                  <h3 className="text-lg text-main-white">create a playlist with your maps</h3>
               </div>
               <span
                  className="text-2xl underline text-transparent bg-clip-text text-shine-hover hover:[filter:drop-shadow(0_1px_5px_color-mix(var(--color-main-light),transparent_60%))] transition-[filter]"
                  style={
                     {
                        '--shine-base': 'var(--color-brand-osu)',
                        '--shine-color': 'color-mix(in oklch, var(--color-main), white 30%)',
                     } as React.CSSProperties
                  }
               >
                  <FontAwesomeIcon icon={faArrowRight} className="mr-2 text-main" />
                  Select an osu folder
               </span>
               <h4 className="text-base font-normal text-main-white">
                  <Suspense fallback={<span className='opacity-0'>...</span>}>
                     <PlaylistsCreated />
                  </Suspense>
               </h4>
            </div>
         </Link>

         <div className="absolute top-0 bottom-0 bg-main w-5 brightness-25 mx-auto inset-0 blur-sm z-1 sm:visible invisible"/>
         <div className="absolute left-0 right-0 bg-main h-5 brightness-25 my-auto inset-0 blur-sm z-1 visible sm:invisible"/>

         <Link
            href="/from-spotify/select"
            className="relative overflow-hidden flex items-center justify-center group"
            transitionTypes={['nav-forward']}
         >
            <Image
               src="/fs2.webp"
               alt="fs"
               fill
               priority
               className="object-cover object-left blur-[2px] brightness-25 group-hover:scale-102 transition-[scale] ease-in"
            />
            <div className="absolute grid items-center text-center gap-7 font-medium group">
               <div className="grid gap-2">
                  <h2 className="text-4xl font-semibold tracking-tight broken-light-title">Spotify to osu!</h2>
                  <h3 className="text-lg text-main-white">pick a playlist to find beatmaps</h3>
               </div>
               <span
                  className="text-2xl underline text-transparent bg-clip-text text-shine-hover hover:[filter:drop-shadow(0_1px_5px_color-mix(var(--color-main-light),transparent_60%))] transition-[filter]"
                  style={{ '--shine-base': 'var(--color-brand-spotify)' } as React.CSSProperties}
               >
                  <FontAwesomeIcon icon={faArrowRight} className="mr-2 text-brand-spotify" />
                  Select a playlist
               </span>
               <h4 className="text-base font-normal text-main-white">
                  <Suspense fallback={<span className='opacity-0'>...</span>}>
                     <MapsDownloaded />
                  </Suspense>
               </h4>
            </div>
         </Link>

         <div className="sr-only">
            <section>
               Pick any public Spotify playlist and the app will try to match each track to osu! beatmaps. You can filter, sort
               and search results with all the options provided by osu search queries and even custom one. Once you&apos;re happy
               with the results, you can download each beatmap individually - or grab them all in a single zip archive.
            </section>
            <section>
               The app will scan all your .osu files to extract track metadata. It then automatically searches for those songs on
               Spotify and YouTube. You can view, listen or watch videos in the app, and instantly generate a Spotify playlist.
               Similarly to the native osu! client, you can organize your songs exactly the way you&apos;re used to.
            </section>
         </div>
      </main>
   )
}
