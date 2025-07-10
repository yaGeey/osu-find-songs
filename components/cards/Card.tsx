import { CombinedSingle, CombinedSingleSimple } from '@/types/types'
import Image from 'next/image'
import Loading from '../state/Loading'
import { twMerge as tw } from 'tailwind-merge'
import React from 'react'
import Spinner from 'react-spinner-material'
import ErrorBackdrop from '../state/ErrorBackdrop'

const getSortValue = (sortFn: string, c: CombinedSingleSimple) => {
   if (!c.osu || !c.spotify) return null
   switch (sortFn) {
      case 'sort-title':
         return null
      case 'sort-artist':
         return null
      case 'sort-bpm':
         return Math.round(c.osu.bpm!)
      case 'sort-creator':
         return c.osu.creator
      case 'sort-date':
         return null
      case 'sort-date-updated':
         return c.osu.last_updated ? new Date(c.osu.last_updated).toLocaleDateString() : null
      case 'sort-length':
         return c.osu.beatmaps[0].total_length
            ? new Date(c.osu.beatmaps[0].total_length * 1000).toISOString().slice(14, 19)
            : null
   }
}

function Card({
   data,
   sortFn,
   selected,
   onClick,
   className,
}: {
   data: CombinedSingleSimple
   sortFn?: string
   selected: boolean
   onClick?: ({ osu, spotify, local }: CombinedSingleSimple) => void
   className?: string
}) {
   const { local, osu, spotify, isOsuLoading, isSpotifyLoading, error } = data

   const handleClick = () => {
      if (onClick && (osu || spotify)) {
         onClick(data)
      }
   }
   // console.log(error)

   return (
      <div
         className={tw(
            'last:rounded-b-lg first:hover:pt-0 hover:py-2 transition-all duration-300 ease-in-out',
            selected && 'first:pt-0 py-2',
            isSpotifyLoading && 'pointer-events-none',
         )}
      >
         <div
            className={tw(
               'bg-dialog-darker select-none relative justify-center items-center text-white flex w-[500px] min-h-[95px] overflow-hidden border-[5px] border-main-border rounded-l-lg transition-all duration-300 ease-in-out hover:opacity-85',
               selected && 'opacity-85 sm:mr-20 rounded-lg',
               className,
            )}
            onClick={handleClick}
         >
            {isOsuLoading && isSpotifyLoading && <Loading />}
            {error && <ErrorBackdrop />}
            {(local.image || osu?.covers.card) && (
               <div className="relative w-[150px] h-[85.5px]">
                  <Image
                     src={local.image || osu?.covers.card || ''}
                     alt={local.title || 'alt'}
                     fill
                     style={{ objectFit: 'cover' }}
                  />
               </div>
            )}
            <div className="flex justify-between items-center w-full py-2 px-4">
               <div className="w-fit max-w-[250px] ">
                  <h1 className="text-lg font-outline-sm">{local.title || osu?.title}</h1>
                  <h2 className="text-white/85 text-sm font-outline-sm">{local.author || osu?.artist}</h2>
               </div>
               <div
                  className={tw('flex gap-2.5 mt-2 items-center -mr-0.5', sortFn && getSortValue(sortFn, data) && 'min-w-[90px]')}
               >
                  {sortFn && getSortValue(sortFn, data) && (
                     <span className="text-white bg-main-border/50 flex justify-center items-center font-[500] rounded-full font-inter-tight px-2 text-xs h-[23px]">
                        {getSortValue(sortFn, data)}
                     </span>
                  )}
                  {isOsuLoading && !isSpotifyLoading && (
                     <div className="relative w-[30px] h-[30px] flex justify-center items-center">
                        <Image src="icons/osu.svg" width={30} height={30} alt="osu" className="animation-in fade-in blur-[1px]" />
                        <Spinner radius={33} color="#ff87c6" stroke={3} visible={true} className="absolute" />
                     </div>
                  )}
                  {spotify && spotify.length == 1 && (
                     <a className="hover:brightness-120 transition-all" href={spotify[0].external_urls.spotify}>
                        <Image src="/icons/Spotify.svg" width={30} height={30} alt="Spotify" className="animation-in fade-in" />
                     </a>
                  )}
                  {spotify && spotify.length > 1 && spotify.length !== 20 && (
                     <div className="relative">
                        <span className="text-white bg-red-400 rounded-full absolute text-xs left-5 -top-1 font-bold w-4 h-4 flex items-center justify-center select-none">
                           {spotify.length}
                        </span>
                        <Image src="/icons/Spotify.svg" width={30} height={30} alt="Spotify" className="min-w-[30px] w-[30px]" />
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   )
}
export default React.memo(Card)
