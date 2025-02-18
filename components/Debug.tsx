import { Song } from "@/types/types";
import { findSong, revalidateSpotifyToken } from "@/utils/Spotify";
import { revalidateOsuToken, getBeatmap } from "@/utils/osu";
import { findBeatmaps, findDetailedInfo, findSongsSpotify, findSongsYoutube } from "@/utils/findCommands";
import CreatePlaylistButton from "./CreatePlaylistButton";

export default function DebugButtons({songs}: {songs: Song[]}) {
   return (
      <div className="flex gap-8">
         <div className="flex gap-2">
            <button onClick={revalidateSpotifyToken} className="bg-green-200 w-fit">revalidateSpotifyToken</button>
            <button onClick={() => findSongsSpotify(songs)} className="bg-green-300 w-fit">Find Spotify Songs</button>
         </div>
         <div className="flex gap-2">
            <button onClick={revalidateOsuToken} className="bg-pink-200 w-fit">revalidateOsuToken</button>
            <button onClick={()=>findBeatmaps(songs)} className="bg-pink-300 w-fit">findBeatmaps</button>
         </div>
         <button onClick={()=>findSongsYoutube(songs)} className="bg-red-200 w-fit">Find Youtube Songs</button>
         <button onClick={() => findDetailedInfo(songs)} className="bg-gray-200 w-fit">findDetailedInfo</button>
      </div>
   )
}