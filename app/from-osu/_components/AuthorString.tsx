import { Artist } from '@/types/Spotify'
import { BeatmapSet } from '@/types/Osu'

//! add styling to link to determine if it's a link or not

export default function AuthorString({ artists, beatmapset }: { artists: Artist[]; beatmapset: BeatmapSet }) {
   if (!artists || (!artists.length && beatmapset)) return <span>{beatmapset.artist}</span>
   return (
      <div>
         {artists.map((artist, i) => (
            <span key={i}>
               <a href={artist.external_urls.spotify} target="_blank" className=" hover:underline">
                  {artist.name}
               </a>
               {i < artists.length - 1 && ', '}
            </span>
         ))}
         {!artists.some((artist: any) => artist.name.toLowerCase() == beatmapset.artist.toLowerCase()) && (
            <span> // {beatmapset.artist}</span>
         )}
      </div>
   )
}
