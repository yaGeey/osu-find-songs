'use client'
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchWithToken } from "@/utils/Spotify";
import { PlaylistPage, Track } from "@/types/Spotify";
import { useEffect } from "react";

type Data = {
   pages: PlaylistPage[];
   pageParams: string[];
}

const playlistId = '2uQjXuFRKw9JqcJzW1ADEz';

export default function FromSpotifyPage() {
   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
      queryKey: ['songs', playlistId],
      queryFn: async ({ pageParam = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100` }) => await fetchWithToken(pageParam),
      getNextPageParam: (lastPage) => lastPage.next ? lastPage.next : undefined,
      getPreviousPageParam: (firstPage) => firstPage.previous ? firstPage.previous : undefined,
      initialPageParam: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100`,
   });
   useEffect(() => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   return (
      <div className="overflow-y-auto h-full">
         <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
         >
            {isFetchingNextPage ? 'Loading more...' : hasNextPage ? `Load More ${data!.pages.length*100}` : 'No more tracks'}
         </button>

         <div className="flex flex-col gap-2 h-[500px] bg-amber-200 overflow-y-auto">
            {(data as Data)?.pages.map((page, i) => (
               <div key={i}>
                  {page.items.map((res, j) => (
                     <div key={res.track.id + j.toString()}>{res.track.name}</div>
                  ))}
               </div>
            ))}
         </div>
      </div>
   );
}