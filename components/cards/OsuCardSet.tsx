'use client'
import { BeatmapSet } from "@/types/Osu";
import OsuCard from "./OsuCard";
import { twMerge as tw } from "tailwind-merge";
import ReactDom from 'react-dom';
import { useEffect, useRef, useState } from "react";
import SwitchSort from "../buttons/SwitchSort";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
// TODO tooltip when in osu card set popup broke styles (Temp fixed - disable popup)

const sortFn = (sortQuery: string) => (a: BeatmapSet, b: BeatmapSet) => {
   if (!sortQuery) return 0;
   const [sort, order] = sortQuery.split('_');

   const sign = order === 'asc' ? 1 : -1;
   if (sort === 'title') return sign * a.title.localeCompare(b.title);
   if (sort === 'artist') return sign * a.artist.localeCompare(b.artist);
   if (sort === 'difficulty') return sign * (Math.max(...a.beatmaps.map(beatmap => beatmap.difficulty_rating)) - (Math.max(...b.beatmaps.map(beatmap => beatmap.difficulty_rating))))
   if (sort === 'ranked') return sign * (new Date(a.submitted_date).getTime() - new Date(b.submitted_date).getTime());
   if (sort === 'plays') return sign * (a.play_count - b.play_count);
   if (sort === 'favorites') return sign * (a.favourite_count - b.favourite_count);
   return 0;
}

export default function OsuCardSet({ beatmapsets, sortQuery, className }: { beatmapsets: BeatmapSet[], sortQuery: string, className?: string }) {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [sortFnString, setSortFnString] = useState('');

   return (
      <>
         <div className={tw('relative h-[120px] group min-w-[386px] w-[464px] cursor-pointer', className)} onClick={() => setIsDialogOpen(true)}>
            {beatmapsets.slice(0, 3).map((beatmapset, i) => (
               <OsuCard key={i} beatmapset={beatmapset} onHover={false} className={tw(
                  'first:z-99 w-full not-first:absolute even:top-[10px] last:top-[20px] even:opacity-35 last:opacity-10 pointer-events-none group-hover:even:top-[15px] group-hover:last:top-[30px]'
               )} />
            ))}
         </div>
         {isDialogOpen && ReactDom.createPortal(
            <div className={`fixed top-0 left-0 w-screen h-screen bg-black/40 z-1000`}>
               <div className={'overflow-hidden absolute w-2/3 min-w-[750px] min-h-[500px] h-4/5 bg-main rounded-xl border-4 border-main-border top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex-col z-1001'}>
                  <div className="flex items-center justify-center gap-4 text-[15px] text-white p-4 bg-main-darker w-full border-b-2 border-main-border">
                     <h4>Sort by</h4>
                     <SwitchSort
                        options={['title', 'artist', 'difficulty', 'ranked', 'plays', 'favorites', 'relevance']}
                        onChange={(val, sort) => setSortFnString(val + '_' + sort)}
                        defaultOption={sortQuery.split('=')[1].split('_')[0]}
                        defaultSort={sortQuery.split('=')[1].split('_')[1]}
                     />
                     <FontAwesomeIcon icon={faXmark} className="cursor-pointer bg-invalid p-2 px-2.5 rounded-full absolute right-4" onClick={() => setIsDialogOpen(false)} />
                  </div>
                  <div className="h-full bg-darker overflow-y-auto scrollbar">
                     <div className="items flex p-4 gap-4 flex-wrap pb-20">
                        {beatmapsets.sort(sortFn(sortFnString)).map((beatmapset, i) => (
                           <OsuCard key={i} beatmapset={beatmapset} className="flex-grow animate-in fade-in shadow-sm" />
                        ))}
                     </div>
                  </div>
                  <button onClick={() => setIsDialogOpen(false)}>Close modal</button>
               </div>
            </div>,
            document.body
         )}

         <style jsx>{`
         .items::after {
            content: '';
            position: absolute;
            bottom: 0;
            left:0;
            right: 0;
            height: 30px;
            background: linear-gradient(transparent, #C07272);
            z-index:1000;
         }
         `}</style>
      </>
   )
}