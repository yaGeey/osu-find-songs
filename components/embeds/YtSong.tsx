import { Song } from "@/types/yt";
import Image from "next/image";

export default function YtSongEmbed({ song }: { song: Song }) {
  console.log(song);
  return (
    <a
      className="bg-main border-4 w-full overflow-hidden border-main-darker rounded-lg flex items-center hover:brightness-110 transition-all"
      href={`https://www.youtube.com/watch?v=${song.videoId}`}
      target="_blank"
    >
      <Image
        src={song.thumbnails[1].url}
        alt=""
        width={0}
        height={0}
        sizes="100vw"
        className="rounded-l-sm w-18.5 h-18.5 object-cover"
      />
      <div className="w-4/5 pl-4 flex flex-col p-1 justify-evenly">
        <h2 className="text-sm font-semibold font-outline-sm">{song.name}</h2>
        <p className="text-xs font-outline-sm text-white/85">
          {song.artist.name}
        </p>
      </div>
      <div className="flex flex-col items-end justify-end p-2 h-full">
        <p className="bg-main-border/70 rounded-xl py-0.5 px-1.5 text-xs">
          {new Date(song.duration * 1000).toISOString().slice(14, 19)}
        </p>
      </div>
    </a>
  );
}
