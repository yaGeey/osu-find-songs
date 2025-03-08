import { SongData } from "@/types/types";
import Image from "next/image";
import Loading from "../state/Loading";
import { twMerge as tw } from "tailwind-merge";
import { SongDataQueried } from "@/types/types";
import React from "react";

const getSortValue = (sortFn: string, data: SongDataQueried) => {
   switch (sortFn) {
      case 'sort-title': return null;
      case 'sort-artist': return null;
      case 'sort-bpm': return Math.round(data.beatmapsetQuery.data?.bpm!);
      case 'sort-creator': return data.beatmapsetQuery.data?.creator;
      case 'sort-date': return null;
      case 'sort-date-mapped': return data.beatmapsetQuery.data?.last_updated ? new Date(data.beatmapsetQuery.data.last_updated).toLocaleDateString() : null;
      case 'sort-length': return data.beatmapsetQuery.data?.beatmaps[0].total_length ?
         new Date(data.beatmapsetQuery.data?.beatmaps[0].total_length * 1000).toISOString().slice(14, 19)
         : null;
   }
} 

function Card({ data, sortFn, selected, onClick, className }: {
   data: SongDataQueried,
   sortFn?: string;
   selected: boolean;
   onClick?: ({ beatmapset, spotify, local }: SongData) => void,
   className?: string
}) {
   const { local, beatmapsetQuery, spotifyQuery } = data;

   const handleClick = () => {
      if (onClick && (beatmapsetQuery.data || spotifyQuery.data)) {
         onClick({ beatmapset: beatmapsetQuery.data!, spotify: spotifyQuery.data ?? null, local });
      }
   }

   return (
      <div
         className={tw(
            "select-none relative justify-center items-center bg-song text-white flex w-[500px] min-h-[90px] border-[5px] border-song-border rounded-lg transition-all duration-300 ease-in-out hover:bg-song-select hover:-mt-1 hover:mb-2",
            selected && 'bg-song-select -mt-1 mb-2 sm:mr-20',
            className,
         )}
         id={local.id}
         onClick={handleClick}
      >
         {(beatmapsetQuery.isLoading || spotifyQuery.isLoading) && <Loading />}
         <div className="relative w-[150px] h-[81px] rounded-l-sm overflow-hidden">
            <Image src={local.image} alt={local.title} fill style={{ objectFit: 'cover' }} />
         </div>
         <div className="flex justify-between items-center w-full py-2 px-4">
            <div>
               <h1 className="text-xl">{local.title}</h1>
               <h2>{local.author}</h2>
            </div>
            <div className={tw(
               "flex gap-3.5 mt-2 items-center -mr-2.5",
               sortFn && getSortValue(sortFn, data) && 'min-w-[90px]',
            )}>
               {sortFn && getSortValue(sortFn, data) &&
                  <span className="text-white bg-main-border/50 flex justify-center items-center font-semibold rounded-full px-2 text-xs h-[23px]">{getSortValue(sortFn, data)}</span>
               }
               {spotifyQuery.data && spotifyQuery.data?.length == 1 &&
                  <a
                     className="hover:brightness-120 transition-all"
                     href={spotifyQuery.data[0].external_urls.spotify}
                  >
                     <Image src="/icons/Spotify.svg" width={30} height={30} alt="Spotify" className='animation animate fade-in'/>
                  </a>
               }
               {spotifyQuery.data && spotifyQuery.data?.length > 1 && spotifyQuery.data?.length !== 20 &&
                  <div className="relative">
                     <span className="text-white bg-red-400 rounded-full absolute text-xs left-5 -top-1 font-bold w-4 h-4 flex items-center justify-center select-none">{spotifyQuery.data.length}</span>
                     {/* Link to detailed info page with parallel toured when implemented */}
                        <Image src="/icons/Spotify.svg" width={30} height={30} alt="Spotify" />
                  </div>
               }
            </div>
         </div>
      </div>
   )
}
export default React.memo(Card);