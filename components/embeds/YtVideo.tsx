import { Video } from '@/types/yt'
import Image from 'next/image'

export default function YtVideo({ data }: { data: Video }) {
   return (
      <a
         className="relative w-[49%] h-[160px] rounded-lg border-main border-4 hover:brightness-110 transition-all shadow-md"
         href={`https://www.youtube.com/watch?v=${data.videoId}`}
         target="_blank"
      >
         <div className="absolute w-[254px] bg-light/85 text-black flex flex-col p-1 pb-0.5 rounded-t-sm">
            <span className="truncate font-semibold text-[15px]">{data.name}</span>
            <span className="truncate text-[13px]">{data.artist.name}</span>
         </div>
         <Image
            src={data.thumbnails[0].url}
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt="thumbnail"
            className="rounded-md"
         />
         <div className="absolute right-0 bottom-0 m-1 bg-black/70 text-white font-semibold w-fit rounded-xl py-0.5 px-1.5 text-xs">
            {new Date(data.duration * 1000).toISOString().slice(14, 19)}
         </div>
      </a>
   )
}
