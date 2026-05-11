import OsuCardSet from './OsuCardSet'
import OsuCard from './OsuCard'
import { BeatmapSet } from '@/types/Osu'
import { twMerge } from 'tailwind-merge'

interface CardRendererProps {
   data: BeatmapSet[]
   sortQuery: string
   className?: string
}

export const CardRenderer = ({ data, sortQuery, className }: CardRendererProps) => {
   if (data.length > 1 && (data.length < 18 || data[0].artist === data[1].artist)) {
      return (
         <OsuCardSet
            beatmapsets={data}
            sortQuery={sortQuery}
            className={twMerge('w-full', className)}
         />
      )
   }
   else return <OsuCard beatmapset={data[0]} className={twMerge('w-full shadow-sm', className)} />
}
