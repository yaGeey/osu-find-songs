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

export default function TestUIPage() {
   const params = useParams();
   const searchParams = useSearchParams();
   const { playlistId } = params;

   const [sortQuery, setSortQuery] = useState<string>('');
   const [searchType, setSearchType] = useState<'local' | 'api'>('api');
   const [beatmapsets, setBeatmapsets] = useState<BeatmapSet[][]>([]);
   const [filteredBeatmapsets, setFilteredBeatmapsets] = useState<BeatmapSet[][]>([]);

   const [isModalVisible, setIsModalVisible] = useState(false);
   const [isModalDownloadingVisible, setIsModalDownloadingVisible] = useState(false);
   const [isModalDownloadedVisible, setIsModalDownloadedVisible] = useState(false);

   // useEffect(() => {
   //    const queryString = localStorage.getItem('searchParams');
   //    if (!queryString) return;
   // }, []);

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
   const isFirstRender = useRef(true);
   useEffect(() => {
      if (isFirstRender.current) { //? prevent on first render
         isFirstRender.current = false;
         return;
      }

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
         <div className="fixed -z-10 brightness-[.8] top-0 left-0 w-full h-full">
            <Image
               src='/bg.svg'
               alt="bg"
               width={0} height={0}
               sizes="100vw"
               quality={100}
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
         </div>

         {isLoading && <progress
            className="w-screen h-2 mb-2"
            value={beatmapsetQueries.filter(q => !q.isLoading).length}
            max={tracks.length}
         ></progress>}

         <header className={tw(
            "bg-main fixed z-100 w-screen h-14 flex justify-center items-center px-4 gap-10 border-b-3 border-darker",
            (isLoading) && '-mt-3.5 border-t-4'
         )}>
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
                  {/* {beatmapsetQueries.filter(q => q.data && q.data.beatmapsets.length).map((q, i) => {
                     if (q.data.beatmapsets.length > 1) return <OsuCardSet key={i} beatmapsets={q.data.beatmapsets} sortQuery={sortQuery || 'sort=relevance_asc'} className="flex-grow animate-in fade-in shadow-sm" />
                     else return <OsuCard key={i} beatmapset={q.data.beatmapsets[0]} className="flex-grow animate-in fade-in shadow-sm" />
                  })} */}
                  {filteredBeatmapsets.filter(data => data && data.length).map((data, i) => {
                     if (data.length > 1) return <OsuCardSet key={i} beatmapsets={data} sortQuery={sortQuery || 'sort=relevance_asc'} className="flex-grow animate-in fade-in duration-1000" />
                     else return <OsuCard key={i} beatmapset={data[0]} className="flex-grow animate-in fade-in duration-1000 shadow-sm" />
                  })}
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
            <p className="text-balance text-center">If there is more than one beatmapset for a song, it will download the first one based on the <span className="text-highlight">filters</span> you searched with.</p>
            <p className=" text-center">Download with <span className="text-highlight">video</span>? It will take up more space.</p>
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