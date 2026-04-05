import { CombinedSingleSimple } from '@/types/types'
import Image from 'next/image'
import Loading from '../../../components/state/Loading'
import { twMerge as tw } from 'tailwind-merge'
import React from 'react'
import Spinner from 'react-spinner-material'
import { SortOptionValue } from '@/utils/selectOptions'

const getSortValue = (sortFn: SortOptionValue, c: CombinedSingleSimple) => {
   if (!c.osu || !c.spotify) return null
   switch (sortFn) {
      case 'title':
      case 'artist':
         return null
      case 'bpm':
         return Math.round(c.osu.bpm!)
      case 'creator':
         return c.osu.creator
      case 'date-updated':
         return c.osu.last_updated ? new Date(c.osu.last_updated).toLocaleDateString() : null
      case 'length':
         return c.osu.beatmaps[0].total_length
            ? new Date(c.osu.beatmaps[0].total_length * 1000).toISOString().slice(14, 19)
            : null
      default:
         throw new Error(`Unknown sort function: ${sortFn satisfies never}`)
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
   sortFn: SortOptionValue | null
   selected: boolean
   onClick?: ({ osu, spotify, local }: CombinedSingleSimple) => void
   className?: string
}) {
   const { local, osu, spotify, isOsuLoading, isSpotifyLoading, error } = data

   const handleClick = () => {
      if (onClick && spotify) {
         onClick(data)
      }
   }

   return (
      <div
         className={tw(
            'last:rounded-b-lg hover:px-3 transition-all duration-300 ease-in-out',
            selected && 'py-2 hover:px-0',
            (isSpotifyLoading || error || spotify === null) && 'pointer-events-none',
         )}
      >
         <div
            className={tw(
               'bg-triangles-faded-right [--color-dialog:var(--color-main-dark)] select-none relative justify-center items-center text-white flex w-[500px] min-h-[95px] overflow-hidden border-[5px] border-main-border rounded-l-lg transition-all duration-300 ease-in-out',
               selected && 'opacity-85 sm:mr-10 rounded-lg hover:sm:mr-5',
               className,
            )}
            onClick={handleClick}
         >
            {isOsuLoading && isSpotifyLoading && <Loading />}
            {error && spotify === null && <ErrorMessage msg={error} />}
            {(local.image || osu?.covers.card) && (
               <div className="relative w-[150px] h-[86px]">
                  <Image
                     src={local.image || osu?.covers.card || ''}
                     alt={local.title || 'alt'}
                     fill
                     style={{ objectFit: 'cover' }}
                  />
               </div>
            )}
            <div className="flex justify-between items-center w-full py-2 px-4">
               <div className="w-fit max-w-[250px] -mt-0.5">
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
                  {!osu && !isSpotifyLoading && (
                     <div className="relative w-[30px] h-[30px] flex justify-center items-center">
                        <Image
                           src="/icons/osu.svg"
                           width={30}
                           height={30}
                           alt="osu"
                           unoptimized
                           className="animation-in fade-in blur-[1px] w-[30px] h-[30px] shrink-0"
                        />
                        {isOsuLoading && <Spinner radius={33} color="#ff87c6" stroke={3} visible={true} className="absolute" />}
                     </div>
                  )}
                  {spotify && spotify.length == 1 && (
                     <a className="hover:brightness-120 transition-all" href={'https://open.spotify.com/track/' + spotify[0].id}>
                        <SpotifyIcon />
                     </a>
                  )}
                  {spotify && spotify.length > 1 && spotify.length !== 20 && (
                     <div className="relative">
                        <span className="text-white bg-red-400 rounded-full absolute text-xs left-5 -top-1 font-bold w-4 h-4 flex items-center justify-center select-none">
                           {spotify.length}
                        </span>
                        <SpotifyIcon />
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   )
}
export default React.memo(Card)

function SpotifyIcon() {
   return (
      <Image src="/icons/Spotify.svg" width={30} height={30} alt="Spotify" className="w-[30px] h-[30px] min-w-[30px] shrink-0" />
   )
}

function ErrorMessage({ msg }: { msg: string }) {
   return (
      <div
         className={`absolute top-0 left-0 w-full h-full flex justify-center items-center z-50 brightness-75 [backdrop-filter:blur(1.5px)]`}
      >
         <p className="text-error flex items-center justify-center gap-2">
            <span className=" text-6xl mb-1.5">&times;</span>
            <span>{msg}</span>
         </p>
      </div>
   )
}
