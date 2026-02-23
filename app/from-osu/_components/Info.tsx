'use client'
import Image from 'next/image'
import { CombinedSingleSimple } from '@/types/types'
import { Spotify } from 'react-spotify-embed'
import { useEffect, useRef } from 'react'
import AuthorString from './AuthorString'
import SpotifyEmbed from '../../../components/embeds/Spotify'
import { twMerge as tw } from 'tailwind-merge'
import useBaseStore from '@/contexts/useBaseStore'
import CloseBtn from '@/components/buttons/CloseBtn'
import CustomLink from '@/components/CustomLink'

export default function Info({ data }: { data: CombinedSingleSimple }) {
   const showSpotifyEmbeds = useBaseStore((state) => state.showSpotifyEmbeds)
   const { local, spotify, osu } = data
   const container = useRef<HTMLDivElement>(null)

   useEffect(() => {
      if (!localStorage.getItem('showSpotifyEmbeds')) localStorage.setItem('showSpotifyEmbeds', 'true')
      // if (!Cookies.get('showYouTubeEmbeds')) Cookies.set('showYouTubeEmbeds', 'true')
   }, [])

   return (
      <div
         ref={container}
         id="info-card"
         className={tw(
            'relative flex flex-col border-5 border-l-0 rounded-xl rounded-l-none border-main-border text-white min-w-[600px] max-w-[600px]',
            'bg-triangles-faded-right [--color-dialog:var(--color-main)]',
         )}
      >
         <CloseBtn
            onClick={() => useBaseStore.setState({ current: null })}
            className="absolute right-2 top-2 visible lgx:invisible z-2 bg-main-dark-vivid"
         />
         <div className="relative flex gap-4 border-b-4 border-main-border p-4">
            <Image
               src={osu?.covers.cover || local.image}
               width={0}
               height={0}
               sizes="100vw"
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
               alt="cover"
               className="absolute inset-0 opacity-30"
               unoptimized
            />
            <div className="flex flex-col justify-between text-ellipsis w-full z-2 font-outline-sm">
               <h1 className="flex items-end gap-3 ">
                  <span className="text-2xl font-semibold font-outline-sm">{local.title}</span>
                  <span>
                     <CustomLink
                        href={`https://osu.ppy.sh/beatmapsets/${osu?.id}`}
                        className="justify-end flex-1 hover:text-white focus:text-white after:bg-white/80 mb-0.5"
                        disabled={!osu}
                        showIcon
                     >
                        map
                     </CustomLink>
                  </span>
               </h1>
               <h2 className="font-medium mt-1 line-clamp-2 font-outline-sm text-[15px]/[19px]">
                  {spotify && spotify?.length != 20 && osu ? (
                     <AuthorString artists={spotify[0].artists.items} beatmapset={osu} />
                  ) : (
                     <span>{osu?.artist}</span>
                  )}
                  {!osu && <span>{local.author}</span>}
               </h2>
            </div>
         </div>

         {/* <div className="relative bg-amber-800 w-full h-full"> */}
         {/* <Image
               src={osu?.covers.cover || local.image}
               width={0}
               height={0}
               sizes="100vw"
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
               alt="cover"
               className="absolute inset-0 opacity-7 z-1"
            /> */}
         <div className="relative scrollbar flex flex-col gap-2 px-1 py-3 w-full h-full bg-main-dark-vivid overflow-auto max-h-[456px]">
            {spotify?.length == 20 && (
               <div className="flex gap-2">
                  <span className="text-5xl text-red-500 font-bold">!</span>
                  <span className="text-lg font-semibold">
                     The song wasn&apos;t found through a normal search query, so there could be a ton of useless results
                  </span>
               </div>
            )}
            {spotify?.map((track, i: number) =>
               showSpotifyEmbeds ? (
                  <Spotify wide link={'https://open.spotify.com/track/' + track.id} key={i} className="z-2 overflow-hidden" />
               ) : (
                  <div className="z-2" key={i}>
                     <SpotifyEmbed track={track} />
                  </div>
               ),
            )}
         </div>
         {/* </div> */}
      </div>
   )
}
