'use client'
import Link from 'next/link'
import { Button } from '@/components/buttons/Buttons'
import BgImage from '@/components/BgImage'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { twMerge as tw } from 'tailwind-merge'
import { useState } from 'react'
import './page.css'

export default function LandingPage() {
   const [details, setDetails] = useState('')
   const [imagesLoaded, setImagesLoaded] = useState({ osu: false, spotify: false })
   return (
      <main className="flex flex-col justify-center items-center [min-height:100dvh] text-white -z-1 gap-16 p-5">
         <BgImage />
         <div className="flex flex-col gap-20 max-sm:gap-0 items-center mt-19 max-landing:mt-12 max-landing:w-fit max-landing:max-w-4/5 max-sm:w-full">
            <div className="h-[400px] max-sm:h-fit max-landing:h-auto flex gap-1 justify-center items-center max-landing:flex-col max-landing:gap-11">
               <div className="max-w-[600px] max-landing:max-w-full h-full max-landing:h-auto px-5 py-10 max-landing:py-0">
                  <div className="flex gap-6 items-center max-sm:flex-col max-landing:justify-center">
                     <Image
                        src="/icon.png"
                        width={80}
                        height={80}
                        alt="osufindsongs - tool for osu and spotify"
                        className="drop-shadow-sm max-sm:scale-80"
                     />
                     <h1 className="text-4xl/[48px] w-[260px] max-sm:text-2xl max-sm:w-full max-landing:text-center max-sm:-mt-5 tracking-tight font-semibold">
                        osufindsongs - find & convert
                     </h1>
                  </div>
                  <h2
                     className="text-lg/[30px] max-landing:text-center text-balance max-sm:text-base mt-[1.95rem] animate-in fade-in slide-in-from-bottom-2.5 duration-1000"
                     key={details ?? 'none'}
                  >
                     {!details &&
                        'A tool that links osu! with Spotify: scan your beatmaps to build playlists and find songs, or find beatmaps from playlists and download them.'}
                     {details === 'from-spotify' &&
                        "Pick any public Spotify playlist and the app will try to match each track to osu! beatmaps. You can filter, sort and search results with all the options provided by osu search queries and even custom one. Once you're happy with the results, you can download each beatmap individually — or grab them all in a single zip archive."}
                     {details === 'from-osu' &&
                        "The app will scan all your .osu files to extract track metadata. It then automatically searches for those songs on Spotify and YouTube. You can view, listen or watch videos in the app, and instantly generate a Spotify playlist. Similarly to the native osu! client, you can organize your songs exactly the way you're used to."}
                  </h2>
                  <div className="sr-only">
                     <section>
                        Pick any public Spotify playlist and the app will try to match each track to osu! beatmaps. You
                        can filter, sort and search results with all the options provided by osu search queries and even custom
                        one. Once you&apos;re happy with the results, you can download each beatmap individually — or grab them
                        all in a single zip archive.
                     </section>
                     <section>
                        The app will scan all your .osu files to extract track metadata. It then automatically searches for those
                        songs on Spotify and YouTube. You can view, listen or watch videos in the app, and instantly generate a
                        Spotify playlist. Similarly to the native osu! client, you can organize your songs exactly the way
                        you&apos;re used to.
                     </section>
                  </div>
               </div>
               <div className="visible landing:hidden w-full flex justify-between items-center max-w-[740px] max-landing:max-w-[590px]">
                  <NavigationButtons details={details} />
               </div>
               <div
                  className="w-[590px] h-[380px] relative max-sm:hidden"
                  onClick={() => setDetails((p) => (p === 'from-spotify' || !p ? 'from-osu' : 'from-spotify'))}
               >
                  <div
                     className={tw(
                        'w-[560px] h-[350px] absolute bottom-0 right-0 border-4 border-main rounded-2xl cursor-pointer overflow-hidden',
                        !imagesLoaded.osu && 'opacity-0',
                        details === 'from-osu'
                           ? 'card-front go-front'
                           : details === 'from-spotify'
                             ? 'card-back go-back'
                             : 'card-back',
                     )}
                  >
                     <Image
                        src="/from-osu.png"
                        alt="From osu! to Spotify"
                        fill
                        priority
                        className="object-cover"
                        onLoad={() => setImagesLoaded((p) => ({ ...p, osu: true }))}
                     />
                  </div>
                  <div
                     className={tw(
                        'w-[560px] h-[350px] absolute bottom-0 right-0 border-4 border-main rounded-2xl cursor-pointer overflow-hidden',
                        !imagesLoaded.spotify && 'opacity-0',
                        details === 'from-spotify'
                           ? 'card-front go-front'
                           : details === 'from-osu'
                             ? 'card-back go-back'
                             : 'card-front',
                     )}
                  >
                     <Image
                        src="/from-spotify.png"
                        alt="From Spotify to osu!"
                        fill
                        priority
                        className="object-cover"
                        onLoad={() => setImagesLoaded((p) => ({ ...p, spotify: true }))}
                     />
                  </div>

                  <span className="absolute -bottom-7 right-0 text-base text-white/60 flex gap-2">
                     {/* prettier-ignore */}
                     <svg aria-hidden="true" className="-mt-1" xmlns="http://www.w3.org/2000/svg" width="30" height="18" viewBox="0 0 30 18" fill="none">
                        <path d="M28.7417 18.0001C29.294 18.0001 29.7417 17.5524 29.7417 17.0001C29.7417 16.4478 29.294 16.0001 28.7417 16.0001V17.0001V18.0001ZM6.26854 0.150156C5.79911 -0.140808 5.1827 0.00386089 4.89173 0.473284L0.15019 8.12297C-0.140775 8.5924 0.00389481 9.20881 0.473318 9.49978C0.942741 9.79074 1.55916 9.64607 1.85012 9.17665L6.06483 2.37693L12.8646 6.59163C13.334 6.8826 13.9504 6.73793 14.2414 6.2685C14.5323 5.79908 14.3877 5.18266 13.9182 4.8917L6.26854 0.150156ZM28.7417 17.0001V16.0001C22.7936 16.0001 18.2637 15.9762 14.7137 14.1145C11.27 12.3086 8.56262 8.64306 6.71525 0.771636L5.7417 1.00012L4.76815 1.22861C6.67588 9.35718 9.60106 13.6917 13.7848 15.8857C17.8623 18.0241 22.9549 18.0001 28.7417 18.0001V17.0001Z" fill="white" fillOpacity="0.6" />
                     </svg>
                     Click on the gallery to get a short description
                  </span>
               </div>
            </div>
            <div className="hidden landing:block w-[740px]">
               <NavigationButtons details={details} />
            </div>
         </div>
         <Footer />
      </main>
   )
}
// bg-gradient-to-l from-brand-spotify to-brand-osu

function NavigationButtons({ details }: { details: string }) {
   return (
      <nav className="w-full grow items-center max-sm:text-base max-sm:-mt-2 flex justify-between text-lg font-medium max-sm:flex-col max-sm:gap-4 max-sm:items-center">
         <Link href="/from-osu/select">
            <Button
               className={tw(
                  'w-70 py-2 text-black max-sm:w-fit',
                  details === 'from-osu' &&
                     'scale-105 animate-border-from-osu [box-shadow:0_0_60px_1px_var(--color-animated-border)]',
                  details !== 'from-osu' && 'border-from-osu',
               )}
            >
               Beatmaps to Spotify
            </Button>
         </Link>
         <Link href="/from-spotify/select">
            <Button
               className={tw(
                  'w-70 py-2 text-black max-sm:w-fit',
                  details === 'from-spotify' &&
                     'scale-105 animate-border-from-spotify [box-shadow:0_0_60px_1px_var(--color-animated-border)]',
                  details !== 'from-spotify' && 'border-from-spotify',
               )}
            >
               Spotify to beatmaps
            </Button>
         </Link>
      </nav>
   )
}
