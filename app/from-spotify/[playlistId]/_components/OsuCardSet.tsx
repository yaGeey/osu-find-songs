'use client'
import { BeatmapSet } from '@/types/Osu'
import OsuCard from './OsuCard'
import { twMerge as tw } from 'tailwind-merge'
import ReactDom from 'react-dom'
import { useMemo, useRef, useState } from 'react'
import SwitchSort from '@/app/from-osu/_components/switches/SwitchSort'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { useAudioStore } from '@/hooks/useAudioStore'
import sortFn from '../_utils/sortBeatmaps'

export default function OsuCardSet({
   beatmapsets,
   sortQuery,
   className,
}: {
   beatmapsets: BeatmapSet[]
   sortQuery: string
   className?: string
}) {
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [sortFnString, setSortFnString] = useState('')
   const ref = useRef<HTMLDivElement>(null)

   const onClose = () => {
      useAudioStore.getState().stop()
      setIsDialogOpen(false)
   }

   const maps = useMemo(() => beatmapsets.sort(sortFn(sortFnString)), [beatmapsets, sortFnString])
   return (
      <>
         <div
            ref={ref}
            className={tw('relative h-[105px] group min-w-[386px] w-[464px] cursor-pointer', className)}
            onClick={() => setIsDialogOpen(true)}
         >
            {beatmapsets.slice(0, 3).map((beatmapset, i) => (
               <OsuCard
                  key={i}
                  beatmapset={beatmapset}
                  onHover={false}
                  className={tw(
                     'first:z-2 w-full not-first:absolute even:top-[5px] last:top-[10px] even:opacity-35 last:opacity-10 pointer-events-none group-hover:even:top-[7px] group-hover:last:top-[14px]',
                  )}
               />
            ))}
         </div>
         {isDialogOpen &&
            ReactDom.createPortal(
               <div className={`fixed top-0 left-0 w-screen h-screen bg-black/40 z-1000`} onClick={onClose}>
                  <div
                     className={
                        'overflow-hidden absolute w-2/3 min-w-[750px] min-h-[500px] h-4/5 bg-main-darker rounded-xl border-4 border-main-border top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex-col z-1001'
                     }
                     onClick={(e) => e.stopPropagation()}
                  >
                     <div className="flex items-center justify-center gap-4 text-[15px] text-white p-4 bg-main-dark w-full border-b-2 border-main-border">
                        <h4>Sort by</h4>
                        <SwitchSort
                           options={['title', 'artist', 'difficulty', 'date ranked', 'rating', 'plays', 'favorites']}
                           onChange={(val, sort) => setSortFnString(val + '_' + sort)}
                           defaultOption={sortQuery.split('_')[0] || 'plays'}
                           defaultSort={sortQuery.split('_')[1] || 'desc'}
                        />
                        <FontAwesomeIcon
                           icon={faXmark}
                           className="cursor-pointer bg-error p-2 px-2.5 rounded-full absolute right-4"
                           onClick={onClose}
                        />
                     </div>
                     <div className="h-full bg-main-darker overflow-y-auto scrollbar">
                        <div className="items flex p-4 gap-4 flex-wrap pb-20">
                           {maps.map((beatmapset, i) => (
                              <OsuCard
                                 key={beatmapset.id}
                                 beatmapset={beatmapset}
                                 className="flex-grow animate-in fade-in shadow-sm"
                              />
                           ))}
                        </div>
                     </div>
                  </div>
               </div>,
               document.body,
            )}

         <style jsx>{`
            .items::after {
               content: '';
               position: absolute;
               bottom: 0;
               left: 0;
               right: 0;
               height: 30px;
               background: linear-gradient(transparent, #c07272);
               z-index: 1000;
            }
         `}</style>
      </>
   )
}
