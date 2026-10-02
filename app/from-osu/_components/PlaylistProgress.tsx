'use client'

import CustomLink from '@/components/CustomLink'
import ProgressBase from '@/components/state/ProgressBase'
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import confetti from 'canvas-confetti'
import { Check, Info, Music4, PartyPopper, RotateCcw, SearchX, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'

export type PlaylistCounters = {
   notFound: number
   total: number
   processed: number
   found: number
   errored: number
   added: number
}

export type PlaylistStatus = { id: string } & PlaylistCounters &
   (
      | {
           status: 'ready' | 'processing' | 'filled'
        }
      | {
           status: 'error'
           message: string
        }
   )

// Deep green — --color-success is too light to read on the pink card (found check + Spotify glyph)
const DEEP_GREEN = 'text-[oklch(0.45_0.14_150)]'

const SAVE_TOOLTIP =
   'Open it, press Ctrl+A to select all tracks, Ctrl+C to copy, then paste (Ctrl+V) into your own playlist.'

function PlaylistLink({ id }: { id: string }) {
   return (
      <CustomLink
         href={`https://open.spotify.com/playlist/${id}`}
         showIcon
         className="inline-flex w-fit items-center gap-1.5 font-medium text-main-gray"
      >
         <FontAwesomeIcon icon={faSpotify} className={DEEP_GREEN} />
         Open in Spotify
      </CustomLink>
   )
}

// Screen 3: the playlist is being filled (search + batched adds run together) / has been filled.
// Shows the same track-processing stats in both cases.
export default function PlaylistProgress({ data, onStartOver }: { data: PlaylistStatus; onStartOver?: () => void }) {
   const isFilled = data.status === 'filled'
   const pct = data.total > 0 ? Math.min(100, Math.round((data.processed / data.total) * 100)) : 0

   // celebrate once, when the playlist gets filled
   // const firedRef = useRef(false)
   // useEffect(() => {
   //    if (!isFilled || firedRef.current) return
   //    firedRef.current = true
   //    confetti({
   //       particleCount: 70,
   //       spread: 75,
   //       startVelocity: 30,
   //       gravity: 0.9,
   //       ticks: 170,
   //       scalar: 0.9,
   //       disableForReducedMotion: true,
   //       colors: ['#ff66aa', '#1ed760', '#ffffff', '#8ab4f8'],
   //       origin: { x: 0.5, y: 0.55 },
   //    })
   // }, [isFilled])

   if (data.status !== 'processing' && !isFilled) return null

   const { found, notFound, processed, total, errored } = data
   const title = isFilled ? 'Your playlist is ready!' : 'Matching your tracks'
   const subtitle = isFilled
      ? 'All tracks processed – open it in Spotify and press play.'
      : 'Searching Spotify for every track you sent. You can close this page and come back later to check the progress.'

   return (
      <div className="flex w-full min-w-0 flex-col gap-5.5">
         <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-main-gray">
               {isFilled ? (
                  <PartyPopper size={18} className="shrink-0 opacity-70" />
               ) : (
                  <Music4 size={18} className="shrink-0 opacity-70" />
               )}
               <span className="truncate">{title}</span>
            </h2>
            <p className="mt-1 text-sm text-main-gray/80">{subtitle}</p>
         </div>

         <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
               <div className="flex items-end justify-between gap-3">
                  <p className="text-3xl leading-none font-bold tracking-tight text-main-gray tabular-nums">
                     {processed}
                     <span className="ml-1 text-base font-semibold text-main-gray/70">/ {total} tracks</span>
                  </p>
                  <span className="text-sm font-semibold text-main-gray/80 tabular-nums">{pct}%</span>
               </div>
               <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Playlist processing progress"
                  className="h-3.5 overflow-hidden rounded-full border-2 border-main-dark-vivid/50 bg-main-dark-vivid/15"
               >
                  <ProgressBase value={pct} color={isFilled ? 'bg-success' : 'bg-main-darker'} className="h-full" />
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-main-gray">
               <span className="flex items-center gap-1.5">
                  <Check size={15} strokeWidth={3} className={`shrink-0 ${DEEP_GREEN}`} />
                  {found} found
               </span>
               <span className="flex items-center gap-1.5 text-main-gray/80">
                  <SearchX size={15} className="shrink-0" />
                  {notFound} not found
               </span>
               {errored > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-error">
                     <TriangleAlert size={15} className="shrink-0" />
                     {errored} errored
                  </span>
               )}
            </div>
         </div>

         {isFilled ? (
            <div className="flex flex-col gap-1.5">
               <PlaylistLink id={data.id} />
               <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-sm text-main-gray/80">
                     You can manage it yourself
                     <span
                        title={SAVE_TOOLTIP}
                        className="grid cursor-help place-items-center text-main-gray/80 transition-colors hover:text-main-gray"
                     >
                        <Info size={14} className="shrink-0" />
                     </span>
                  </p>
                  <button
                     type="button"
                     onClick={onStartOver}
                     className="group flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-main-gray transition-colors hover:text-black"
                  >
                     <RotateCcw size={14} className="shrink-0 transition-transform group-hover:-rotate-45" />
                     Start over
                  </button>
               </div>
            </div>
         ) : (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-main-gray/80">
               <PlaylistLink id={data.id} />
               <span>found tracks are added in batches of 50</span>
            </div>
         )}
      </div>
   )
}
