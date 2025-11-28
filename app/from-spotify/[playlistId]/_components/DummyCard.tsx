import { twMerge as tw } from 'tailwind-merge'
import { BeatmapSet } from '@/types/Osu'
import ImageFallback from '@/components/ImageFallback'

export default function DummyCard({ beatmapset, className }: { beatmapset: BeatmapSet; className?: string }) {
   return (
      <div
         className={tw(
            'h-26 overflow-hidden rounded-2xl min-w-[386px] w-[464px] bg-main border-2 border-main-border flex',
            className,
         )}
      >
         <div className="relative w-[100px] h-full bg-main-darker">
            <ImageFallback src={beatmapset.covers.list} alt="" fill style={{ objectFit: 'cover' }} />
         </div>
         <div className="relative flex-grow flex justify-end">
            <ImageFallback src={beatmapset.covers.card} alt="" width={286} height={100} className="opacity-50" />
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-main to-main/70"></div>
         </div>
      </div>
   )
}
