import { BeatmapSet } from '@/types/Osu'
import { SpotifyTrack } from '@/types/graphql-spotify/searchDesktop';

//TODO add styling to link to determine if it's a link or not

export default function AuthorString({ artists, beatmapset }: { artists: SpotifyTrack['artists']['items']; beatmapset: BeatmapSet }) {
   if (!artists || (!artists.length && beatmapset)) return <span>{beatmapset.artist}</span>
   return (
      <div>
         {artists.map((artist, i) => (
            <span key={i}>
               <a href={'https://open.spotify.com/artist/'+artist.uri.split(':').at(-1)} target="_blank" className=" hover:underline">
                  {artist.profile.name}
               </a>
               {i < artists.length - 1 && ', '}
            </span>
         ))}
         {!artists.some((artist) => artist.profile.name?.toLowerCase() == beatmapset.artist?.toLowerCase()) && (
            <span>
               {' '}
               {'//'} {beatmapset.artist}
            </span>
         )}
      </div>
   )
}
