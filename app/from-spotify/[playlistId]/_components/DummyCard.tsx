import { twMerge as tw } from 'tailwind-merge'
import { BeatmapSet } from '@/types/Osu'
import ImageFallback from '@/components/ImageFallback'

// Stacked "other candidates" behind the main card: only a ~5–16px strip at the bottom is ever visible.
// The right side therefore reuses the smallest cover variant (list: 160×120) instead of card (400×140)
// — ~3× less decoded bitmap per card, which is invisible at 20–50% opacity.
export default function DummyCard({ beatmapset, className }: { beatmapset: BeatmapSet; className?: string }) {
   return (
      <div
         className={tw(
            'h-26 overflow-hidden rounded-2xl min-w-[386px] w-[464px] bg-main border-2 border-main-border flex',
            className,
         )}
      >
         <div className="relative w-21 h-full bg-main-darker">
            <ImageFallback src={beatmapset.covers.list} alt="" fill style={{ objectFit: 'cover' }} />
         </div>
         <div className="relative flex-grow flex justify-end">
            <ImageFallback src={beatmapset.covers.list} alt="" width={286} height={104} className="opacity-50 object-cover" />
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-main to-main/70"></div>
         </div>
      </div>
   )
}
