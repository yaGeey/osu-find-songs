'use client'
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import { twMerge as tw } from "tailwind-merge";
import { useParams, useSearchParams } from "next/navigation";
import OsuCard from "@/components/cards/OsuCard";
import { useInfiniteQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchWithToken } from "@/lib/Spotify";
import { PlaylistPage } from "@/types/Spotify";
import { Button } from "@/components/Buttons";
import { beatmapsSearch } from "@/lib/osu";
import HomeBtn from "@/components/buttons/HomeBtn";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import JSZip from 'jszip';
import { getNoVideo, download, getVideo, downloadNoVideo } from "@/utils/osuDownload";
import Modal from "@/components/Modal";
import { BeatmapSet } from "@/types/Osu";
import OsuCardSet from "@/components/cards/OsuCardSet";
import { ToastContainer, toast } from 'react-toastify';
import Filters from "./Filters";
import Search from "./Search";
import { LinearProgress } from '@mui/material';
import Progress from "@/components/state/Progress";
import BgImage from "@/components/BgImage";

export default function TestUIPage() {
   const params = useParams();
   const searchParams = useSearchParams();
   const { playlistId } = params;

   const [hasQueryChanged, setHasQueryChanged] = useState(false);
   const [sortQuery, setSortQuery] = useState<string>('');
   const [searchType, setSearchType] = useState<'local' | 'api'>('api');
   const [beatmapsets, setBeatmapsets] = useState<BeatmapSet[][]>([]);
   const [filteredBeatmapsets, setFilteredBeatmapsets] = useState<BeatmapSet[][]>([]);

   const [isModalVisible, setIsModalVisible] = useState(false);
   const [isModalDownloadingVisible, setIsModalDownloadingVisible] = useState(false);
   const [isModalDownloadedVisible, setIsModalDownloadedVisible] = useState(false);

   // fetching playlist
   const { data: tracksData, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
      queryKey: ['spotify-playlist', playlistId], //? idk why but this cause endless fetching on first page load, so...
      queryFn: async ({ pageParam = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100` }) => await fetchWithToken(pageParam),
      getNextPageParam: (lastPage) => lastPage.next ? lastPage.next : undefined,
      getPreviousPageParam: (firstPage) => firstPage.previous ? firstPage.previous : undefined,
      initialPageParam: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100`,
   });
   useEffect(() => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   useEffect(() => {
      //? ...we are cancelling the query on mount and the refetching it
      queryClient.cancelQueries({ queryKey: ['spotify-playlist', playlistId] })
      refetch();
   }, [])
   const queryClient = useQueryClient()

   const tracks = tracksData?.pages.map((page: PlaylistPage) => page.items).flat() || [];

   // beatmapset search
   const beatmapsetQueries = useQueries({
      queries: tracks.map((track) => ({
         queryKey: ['beatmapset', track.track.artists[0].name, track.track.name],
         queryFn: async () => {
            return await beatmapsSearch(`artist=${track.track.artists[0].name} title=${track.track.name} ${searchParams.get('q') || ''}`, sortQuery);
         },
         enabled: !!tracks,
         staleTime: Infinity
      })),
   });
   const isLoading = useMemo(() => beatmapsetQueries.some(q => q.isLoading), [beatmapsetQueries]);
   
   // setting data for display
   useEffect(() => {
      const data = beatmapsetQueries.map(q => q.data?.beatmapsets);
      setBeatmapsets(data);
      setFilteredBeatmapsets(data);
   }, [beatmapsetQueries.filter(q => !q.isLoading).length, beatmapsetQueries.filter(q => !q.isFetching).length]);

   // search
   useEffect(() => {
      if (!hasQueryChanged && !searchParams.get('q') && !searchParams.get('sort')) return;
      else setHasQueryChanged(true);

      if (searchType == 'api') {
         const timer = setTimeout(() => {
            queryClient.removeQueries({
               predicate: (query) => {
                  return query.queryKey[0] !== 'spotify-playlist';
               }
            });
            beatmapsetQueries.forEach((query) => query.refetch())
         }, 2000);
         return () => clearTimeout(timer)
      }
      if (searchType == 'local') console.log('local search');
   }, [searchParams.get('q'), searchParams.get('sort')]);


   // download maps
   function handleDownloadAll(video: boolean) {
      const zip = new JSZip();
      beatmapsetQueries.forEach((q) => {
         if (!q.data || !q.data.beatmapsets.length) return;
         const beatmapset: BeatmapSet = q.data?.beatmapsets[0];

         const filename = `${beatmapset.id} ${beatmapset.artist} - ${beatmapset.title}.osz`;
         if (video) {
            if (beatmapset.video) zip.file(filename, getVideo(beatmapset.id));
            else zip.file(filename, getNoVideo(beatmapset.id));
         } else {
            zip.file(filename, getNoVideo(beatmapset.id));
         }
      });
      const promise = zip.generateAsync({ type: 'blob' }).then((blob) => download(blob, 'beatmaps.zip'))
      
      toast.promise(promise, {
         pending: 'Downloading...',
         success: 'Downloaded successfully',
         error: 'Download failed',
      });
      promise.then(() => {
         if (isModalDownloadingVisible) {
            setIsModalDownloadingVisible(false);
            setIsModalDownloadedVisible(true);
         }
      })
   }

   return (
      <div className="max-h-screen min-w-[600px] min-h-[670px] font-inter overflow-y-auto overflow-x-hidden scrollbar">
         <BgImage brightness={8} image='/bg.svg'/>
         <Progress isLoading={isLoading} value={(beatmapsetQueries.filter(q => !q.isLoading).length * 100) / tracks.length}/>

         <header className={tw("bg-main fixed z-100 w-screen h-14 flex justify-center items-center px-4 gap-10 border-b-3 border-darker",)}>
            <section className="absolute left-4">
               <HomeBtn />
            </section>
            <Button onClick={() => setIsModalVisible(true)} className="text-white py-1 w-45">
               Download all
               <FontAwesomeIcon icon={faDownload} className="ml-2" />
            </Button>
            <Search beatmapsets={beatmapsets} onChange={setFilteredBeatmapsets} />
         </header>

         <main className="flex justify-center items-center min-h-[calc(100vh-4rem)] mt-[56px]">
            <div className=" min-h-[calc(100vh-3.5rem)] bg-darker md:w-4/5 w-full min-w-[750px]">
               
               <Filters
                  onChangeSort={(val, searchTypeRes) => {
                     setSortQuery(val)
                     setSearchType(searchTypeRes)
                  }}
                  beatmapsetQueries={beatmapsetQueries}
                  beatmapsetLocal={beatmapsets}
               />
               
               <div className="flex p-4 gap-4 flex-wrap bg-darker overflow-y-auto">
                  {filteredBeatmapsets.filter(data => data && data.length).map((data, i) => {
                     if (data.length > 1) return <OsuCardSet key={i} beatmapsets={data} sortQuery={sortQuery || 'sort=relevance_asc'} className="flex-grow animate-in fade-in duration-1000" />
                     else return <OsuCard key={i} beatmapset={data[0]} className="flex-grow animate-in fade-in duration-1000 shadow-sm" />
                  })}
                  {!filteredBeatmapsets.filter(data => data && data.length).length &&
                     <div className="text-black/40 text-2xl h-full w-full text-center mt-10 ">No results found</div>
                  }
               </div>
            </div>
         </main>

         

         {/* modals */}
         <Modal
            isOpen={isModalVisible}
            dialog
            onOkay={() => {
               setIsModalVisible(false);
               setIsModalDownloadingVisible(true);
               handleDownloadAll(false);
            }}
            okBtn='No'
            onClose={() => {
               setIsModalVisible(false);
               setIsModalDownloadingVisible(true);
               handleDownloadAll(true);
            }}
            closeBtn='Yes'
            state='info'
         >
            <p className="text-balance text-center">If there is more than one beatmapset for a song, it will download the first one based on the <span className="text-highlight font-outline">filters</span> you searched with.</p>
            <p className=" text-center">Download with <span className="text-highlight font-outline">video</span>? It will take up more space.</p>
         </Modal>
         <Modal
            isOpen={isModalDownloadingVisible}
            onOkay={() => setIsModalDownloadingVisible(false)}
            okBtn='Got it'
            state='info'
         >This can take some time, don't close this page</Modal>
         <Modal
            isOpen={isModalDownloadedVisible}
            onOkay={() => setIsModalDownloadedVisible(false)}
            okBtn='Close'
            state='success'
            dialog
         >Downloaded successfully</Modal>
         <ToastContainer />
      </div>
   )
}