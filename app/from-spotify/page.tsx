// import { useInfiniteQuery } from "@tanstack/react-query"

import { Playlist } from "@/types/Spotify";
import { getPlaylist } from "@/utils/Spotify"

export default async function FromSpotifyPage() {
   // const data = useInfiniteQuery({
   //    queryKey: ['songs'],
   //    queryFn: async ({ pageParam = 0 }) => {
   //       const res = await fetch(`/api/songs?page=${pageParam}`)
   //       return res.json()
   //    },
   //    getNextPageParam: (lastPage: any[], allPages: any[]) => {
   //       return lastPage.length ? allPages.length : undefined
   //    },
   //    initialPageParam: 0
   // })
   const data: Playlist = await getPlaylist('2uQjXuFRKw9JqcJzW1ADEz')
   console.log(data);
   
   return (
      <div>
         {data.toString()}
      </div>
   )
}