import { BeatmapSet } from "@/types/Osu"
import Image from "next/image"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faCirclePlay, faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import { faDownload, faFileVideo } from '@fortawesome/free-solid-svg-icons';
import { twMerge as tw } from "tailwind-merge"
import { downloadNoVideo, downloadVideo } from "@/utils/osuDownload"
import { Tooltip } from 'react-tooltip'

export default function OsuCard({ beatmapset, onHover=true, className }: { beatmapset: BeatmapSet, onHover?:boolean, className?: string }) {
   return (
      <>
         <div className={tw("group select-none relative h-26 font-inter rounded-2xl min-w-[386px] w-[464px] bg-main flex border-2 border-main-border hover:brightness-110 transition-all", className)}>
            <div className="relative w-[100px] h-full rounded-l-2xl overflow-hidden z-0">
               <Image src={beatmapset.covers.list} alt="list" fill style={{ objectFit: 'cover' }} sizes="100%" />
            </div>
            <div className="relative flex-grow flex justify-end rounded-r-2xl overflow-hidden">
               <Image src={beatmapset.covers.card} alt="cover" width={286} height={100} className="z-10 w-auto h-auto" />
               <div className="absolute top-0 right-0 w-[289px] h-full bg-gradient-to-r from-main to-main/70 rounded-r-2xl z-15"></div>
            </div>

            <div className="absolute top-0 left-21 w-[calc(100%-5.25rem)] h-full bg-main rounded-2xl z-1"></div>
            <a href={`https://osu.ppy.sh/beatmapsets/${beatmapset.id}`} className="absolute top-0 left-21 w-[calc(100%-5.25rem)] h-full z-20 px-4 py-1 flex flex-col justify-between text-white">
               <div>
                  <h2 className="font-semibold text-[17px] truncate">{beatmapset.title}</h2>
                  <h3 className="font-medium text-sm -mt-1">from {beatmapset.artist}</h3>
               </div>
               <h4 className="font-inter-tight text-xs">created by <span className="text-highlight">{beatmapset.creator}</span></h4>
               <div className="flex gap-2.5 text-main-gray text-[11px] items-center">
                  <FontAwesomeIcon icon={faHeart} />
                  <span className="-ml-1.75 -mb-0.25">{beatmapset.favourite_count}</span>
                  <FontAwesomeIcon icon={faCirclePlay}/>
                  <span className="-ml-1.75 -mb-0.25">{beatmapset.play_count.toLocaleString(undefined)}</span>
                  <FontAwesomeIcon icon={faCircleCheck}/>
                  <span className="-ml-1.75 -mb-0.25">{new Date(beatmapset.submitted_date).toLocaleDateString()}</span>
               </div>
               <h4 className={tw("text-xs text-main-gray w-fit px-1 rounded-full font-medium",
                  beatmapset.status === 'ranked' && 'bg-[#B3FF66]',
                  beatmapset.status === 'approved' && 'bg-[#B3FF66',
                  beatmapset.status === 'qualified' && 'bg-[#FFD966]',
                  beatmapset.status === 'loved' && 'bg-[#FF66AB]')}
               >{beatmapset.status.toUpperCase()}</h4>
            </a>

            {/* download buttons */}
            <div className={tw("absolute top-0 right-0 h-full w-7 bg-darker hidden flex-col items-center justify-center gap-5  text-black/50 text-sm z-100 rounded-r-[14px] overflow-hidden", onHover && 'group-hover:flex')}>
               <FontAwesomeIcon
                  icon={faDownload}
                  onClick={() => downloadNoVideo(beatmapset.id, `${beatmapset.id} ${beatmapset.artist} - ${beatmapset.title}.osz`)}
                  className="cursor-pointer"
                  data-tooltip-id='tooltip'
                  data-tooltip-content='Download without video'
                  data-tooltip-delay-show={400}
               />
               
               {beatmapset.video &&
                  <FontAwesomeIcon icon={faFileVideo}
                     onClick={() => downloadVideo(beatmapset.id, `${beatmapset.id} ${beatmapset.artist} - ${beatmapset.title} [VIDEO].osz`)}
                     className="cursor-pointer"
                     data-tooltip-id='tooltip'
                     data-tooltip-content='Download with video'
                     data-tooltip-delay-show={400}
                  />
               }
            </div>
            {/* <Tooltip id='tooltip' place="top" style={{fontSize: '11px', padding: '0 0.25rem', zIndex:100000}}/> */}
         </div>
      </>
   )
}