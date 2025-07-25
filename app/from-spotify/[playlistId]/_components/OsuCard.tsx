import { BeatmapSet } from '@/types/Osu'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faCirclePlay, faCircleCheck, faThumbsUp } from '@fortawesome/free-regular-svg-icons'
import { faDownload, faFileVideo } from '@fortawesome/free-solid-svg-icons'
import { twMerge as tw } from 'tailwind-merge'
import { useNoVideoAxios } from '@/utils/osuDownload'
import { Tooltip } from 'react-tooltip'
import { groupBy } from '@/utils/arrayManaging'
import { useRef } from 'react'
import ImageFallback from '@/components/ImageFallback'
import { getRating } from '@/app/from-spotify/[playlistId]/_utils/sortBeatmapsMatrix'

export default function OsuCard({
   beatmapset,
   onHover = true,
   className,
}: {
   beatmapset: BeatmapSet
   onHover?: boolean
   className?: string
}) {
   const ref = useRef<HTMLDivElement>(null)

   // Dates tooltip text
   const dates = {
      'Submitted at': beatmapset.submitted_date,
      'Last updated at': beatmapset.last_updated,
      'Ranked at': beatmapset.ranked_date,
   }
   const dateString = Object.entries(dates)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k} ${new Date(v!).toLocaleDateString()}`)
      .join(' | ')

   const mutation = useNoVideoAxios(beatmapset.id, `${beatmapset.id} ${beatmapset.artist} - ${beatmapset.title}.osz`)
   return (
      <>
         <div
            ref={ref}
            className={tw(
               'group/card select-none relative h-26 font-inter overflow-hidden rounded-2xl min-w-[386px] w-[464px] bg-main flex border-2 border-main-border hover:brightness-110 transition-all z-0',
               className,
            )}
         >
            {
               <>
                  {/* IMAGES */}
                  <div className="relative w-[100px] h-full overflow-hidden z-0">
                     <ImageFallback
                        src={beatmapset.covers.list}
                        alt="list"
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="100%"
                        loading="lazy"
                     />
                  </div>
                  <div className="relative flex-grow flex justify-end overflow-hidden">
                     <ImageFallback
                        src={beatmapset.covers.card}
                        alt="cover"
                        width={286}
                        height={100}
                        className="z-10 w-max-[286px] h-auto"
                        loading="lazy"
                     />
                     <div className="absolute top-0 right-0 w-[289px] h-full bg-gradient-to-r from-main to-main/70 z-15"></div>
                  </div>

                  <div className="absolute top-0 left-21 w-[calc(100%-5.25rem)] h-full bg-main z-1"></div>
                  <a
                     target="_blank"
                     href={`https://osu.ppy.sh/beatmapsets/${beatmapset.id}`}
                     className="absolute top-0 left-21 w-[calc(100%-5.25rem)] h-full z-20 px-4 py-1 flex flex-col justify-between text-white"
                  >
                     {/* INFORMATION */}
                     <div className="truncate font-outline-sm">
                        <h2 className="font-semibold text-[17px]">{beatmapset.title}</h2>
                        <h3 className="font-medium text-sm -mt-1">from {beatmapset.artist}</h3>
                     </div>
                     <h4 className="font-inter-tight text-xs">
                        created by <span className="text-highlight">{beatmapset.creator}</span>
                     </h4>
                     <div className="flex gap-2.5 text-main-gray text-[11px] items-center">
                        <FontAwesomeIcon icon={faHeart} />
                        <span className="-ml-1.75 -mb-0.25">{beatmapset.favourite_count}</span>
                        <FontAwesomeIcon icon={faCirclePlay} />
                        <span className="-ml-1.75 -mb-0.25">{beatmapset.play_count.toLocaleString(undefined)}</span>
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span className="-ml-1.75 -mb-0.25">{getRating(beatmapset)}%</span>
                        <FontAwesomeIcon icon={faCircleCheck} />
                        <span className="-ml-1.75 -mb-0.25" data-tooltip-id="tooltip" data-tooltip-content={dateString}>
                           {new Date(
                              beatmapset.ranked_date ? beatmapset.ranked_date : beatmapset.submitted_date,
                           ).toLocaleDateString()}
                        </span>
                     </div>
                     <div className="flex gap-1 items-center">
                        {/* STATE */}
                        <h4
                           className={tw(
                              'text-xs text-main-gray w-fit px-1 rounded-full font-medium',
                              beatmapset.status === 'ranked' && 'bg-[#B3FF66]',
                              beatmapset.status === 'approved' && 'bg-[#B3FF66',
                              beatmapset.status === 'qualified' && 'bg-[#FFD966]',
                              beatmapset.status === 'loved' && 'bg-[#FF66AB]',
                              beatmapset.status === 'graveyard' && 'bg-main-gray text-main-lighter',
                           )}
                        >
                           {beatmapset.status.toUpperCase()}
                        </h4>

                        {/* DIFFICULTY */}
                        <section className="peer group/diff flex text-[11px] text-main-gray font-inter-tight gap-1">
                           {beatmapset.beatmaps.length < 15 ? (
                              Object.keys(groupBy(beatmapset.beatmaps, 'mode')).map((mode, i) => (
                                 <div key={i} className="flex gap-0.5">
                                    <Image src={`/osu/${mode}.png`} alt={mode} width={15} height={15} />
                                    <div className="flex gap-0.25">
                                       {groupBy(beatmapset.beatmaps, 'mode')
                                          [mode].sort((a, b) => a.difficulty_rating - b.difficulty_rating)
                                          .map((beatmap, j) => (
                                             <div
                                                style={getColor(beatmap.difficulty_rating)}
                                                data-tooltip-id="tooltip"
                                                data-tooltip-content={`${beatmap.mode} | ${beatmap.difficulty_rating} - ${beatmap.version}`}
                                                key={j}
                                                className="h-[15px] w-[8px] rounded-full drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.15)]"
                                             ></div>
                                          ))}
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <span className="font-semibold text-xs">{beatmapset.beatmaps.length}</span>
                           )}
                        </section>
                     </div>
                  </a>

                  {/* download buttons */}
                  <div
                     className={tw(
                        'absolute top-0 right-0 h-full w-7 bg-darker hidden flex-col items-center justify-center gap-5  text-black/50 text-sm z-100 rounded-r-[14px] overflow-hidden',
                        onHover && 'group-hover/card:flex',
                     )}
                  >
                     <FontAwesomeIcon
                        icon={beatmapset.video ? faFileVideo : faDownload}
                        onClick={() => mutation.mutate()}
                        className="cursor-pointer"
                        data-tooltip-id="tooltip"
                        data-tooltip-content={beatmapset.video ? 'Download with video' : 'Download without video'}
                        data-tooltip-delay-show={400}
                     />
                  </div>
                  <Tooltip id="tooltip" place="top" style={{ fontSize: '11px', padding: '0 0.25rem', zIndex: 100000 }} />
               </>
            }
         </div>
      </>
   )
}

function getColor(diff: number) {
   const clamped = Math.max(0, Math.min(diff, 9))
   const hue = 250 - (250 * clamped) / 6
   return {
      backgroundColor: `hsl(${hue}, 70%, 50%)`,
      color: diff > 5.8 ? '#FFD700' : 'black',
      fontWeight: 600,
   }
}
