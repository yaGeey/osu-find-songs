import { Track } from "@/types/Spotify";
import Image from "next/image";

export default function SpotifyEmbed({ track }: { track: Track }) {
  return (
    <a
      className="bg-main border-4 border-main-darker rounded-lg flex items-center hover:brightness-110 transition-all"
      href={track.external_urls.spotify}
      target="_blank"
    >
      <Image
        src={track.album.images[0].url}
        alt={track.album.name}
        width={0}
        height={0}
        sizes="100vw"
        className="rounded-l-sm w-18.5 h-18.5 object-cover"
      />
      <div className="w-4/5 pl-4 flex flex-col p-1 font-outline-sm">
        <h2 className="text-base font-semibold">{track.name}</h2>
        <p className="text-sm">{track.artists.map((a) => a.name).join(", ")}</p>
        <p className="text-xs">{track.album.name}</p>
      </div>
      <div className="flex flex-col items-end justify-between p-2 h-full ">
        <p className="text-[13px] font-outline-sm">
          {new Date(track.album.release_date).toLocaleDateString()}
        </p>
        <p className="bg-main-border/70 rounded-xl py-0.5 px-1.5 text-xs">
          {new Date(track.duration_ms).toISOString().slice(14, 19)}
        </p>
      </div>
    </a>
  );
}
