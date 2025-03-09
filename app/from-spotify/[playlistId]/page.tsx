'use client'
import Image from "next/image";
import FilterSelector from "@/components/buttons/FilterSelector";
import Switch from "@/components/buttons/Switch";
import SwitchFull from "@/components/buttons/SwitchFull";
import { useCallback, useEffect, useMemo, useState } from "react";
import { twMerge as tw } from "tailwind-merge";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import OsuCard from "@/components/cards/OsuCard";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { fetchWithToken } from "@/lib/Spotify";
import { PlaylistPage } from "@/types/Spotify";
import { Button } from "@/components/Buttons";
import { beatmapsSearch } from "@/lib/osu";
import HomeBtn from "@/components/buttons/HomeBtn";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faDownload } from '@fortawesome/free-solid-svg-icons'
import JSZip from 'jszip';
import { getNoVideo, download, getVideo, downloadNoVideo } from "@/utils/osuDownload";
import Modal from "@/components/Modal";
import { BeatmapSet } from "@/types/Osu";
import OsuCardSet from "@/components/cards/OsuCardSet";
import SwitchSort from "@/components/buttons/SwitchSort";
import FileSaver from "file-saver";

export default function TestUIPage() {
   const [unfolded, setUnfolded] = useState(false);
   const params = useParams();
   const searchParams = useSearchParams();
   const pathname = usePathname()
   const { playlistId } = params;
   const [maps, setMaps] = useState<BeatmapSet[]>([]);
   const [sortQuery, setSortQuery] = useState<string>('');

   const [isModalVisible, setIsModalVisible] = useState(false);
   const [isModalDownloadingVisible, setIsModalDownloadingVisible] = useState(false);
   const [isModalDownloadedVisible, setIsModalDownloadedVisible] = useState(false);

   const [query, setQuery] = useState({ star: '', ar: '', cs: '', od: '', hp: '', bpm: '', length: '', source: '', created: '', updated: '', ranked: '' });
   useEffect(() => {
      const queryString = localStorage.getItem('searchParams');
      if (!queryString) return;
      //! POPUP Do you want to load the previous search filters?
      // const searchParams = new URLSearchParams(queryString);
   }, []);

   // fetching playlist
   const { data: tracksData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
      queryKey: ['spotify-playlist', playlistId],
      queryFn: async ({ pageParam = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100` }) => await fetchWithToken(pageParam),
      getNextPageParam: (lastPage) => lastPage.next ? lastPage.next : undefined,
      getPreviousPageParam: (firstPage) => firstPage.previous ? firstPage.previous : undefined,
      initialPageParam: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100`,
   });
   useEffect(() => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   const tracks = tracksData?.pages.map((page: PlaylistPage) => page.items).flat() || [];

   // beatmapset search
   const beatmapsetQueries = useQueries({
      queries: tracks.map((track) => ({
         queryKey: ['beatmapset', track.track.artists[0].name, track.track.name],
         queryFn: async () => {
            console.log(`artist=${track.track.artists[0].name} title=${track.track.name} ${searchParams.get('q') || ''}`)
            return await beatmapsSearch(`artist=${track.track.artists[0].name} title=${track.track.name} ${searchParams.get('q') || ''}`, sortQuery)
         },
         enabled: !!tracks,
      })),
   });
   const isLoading = useMemo(() => beatmapsetQueries.some(q => q.isLoading), [beatmapsetQueries]);

   // creating query 
   const createQueryString = (name: string, filter: 'gt' | 'lt' | 'eq' | '', value: string) => {
      const filtersDict = { 'gt': '>', 'lt': '<', 'eq': '=' };

      const filterString = value && value != '0' && filter ? filtersDict[filter] : '';
      const newQuery = { ...query, [name]: filterString + value };
      setQuery(newQuery);

      let queryString = '';
      Object.entries(newQuery).forEach(([key, value]) => {
         if (!value || value == '0') return;
         if (!queryString) queryString += '?q=';
         queryString += `${key}${encodeURIComponent(value)}+`;
      });
      queryString = queryString.slice(0, -1);

      window.history.replaceState(null, '', pathname + queryString);
      localStorage.setItem('searchParams', queryString);
   };

   // handlers
   const handleSearch = () => {
      beatmapsetQueries.forEach((query) => query.refetch())
   };

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
      zip.generateAsync({ type: 'blob' }).then((blob) => download(blob, 'beatmaps.zip')).then(() => {
         if (isModalDownloadingVisible) {
            setIsModalDownloadingVisible(false);
            setIsModalDownloadedVisible(true);
         }
         console.log('Downloading done');
      });
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
            className="w-screen h-3 mb-2"
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

            <Button onClick={handleSearch} className="text-white py-1 w-45">
               Search
               <FontAwesomeIcon icon={faMagnifyingGlass} className="ml-2" />
            </Button>
            <Button onClick={() => setIsModalVisible(true)} className="text-white py-1 w-45">
               Download all
               <FontAwesomeIcon icon={faDownload} className="ml-2" />
            </Button>
         </header>

         <main className="flex justify-center items-center h-[calc(100vh-4rem)] mt-[56px]">
            <div className=" h-full bg-darker md:w-4/5 w-full min-w-[750px]">
               {/* filters */}
               <div className={tw("bg-main-darker z-110 sticky top-[56px] px-5 py-2 text-white shadow-tight text-nowrap", unfolded && 'pb-5')}>

                  {/* Main filters */}
                  <div className="flex items-center justify-between text-[15px]">
                     <section className="flex items-center gap-4">
                        <h4>Star rating</h4>
                        <FilterSelector min={0} max={10} type="number" onChange={(val, filter) => createQueryString('star', filter, val)} />
                     </section>
                     <section className="flex items-center gap-4">
                        <h4 >State</h4>
                        <SwitchFull options={['ranked', 'loved', 'approved', 'pending']} onChange={(val) => createQueryString('status', 'eq', val)} />
                     </section>
                     <button className="selected bg-darker rounded-full px-4 py-1.5" onClick={() => setUnfolded(p => !p)}>
                        More filters {unfolded ? <span className="writing-mode-vertical-lr">&lt;</span> : <span className="writing-mode-vertical-rl">&gt;</span>}
                     </button>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-[15px]">
                     <h4>Sort by</h4>
                     <SwitchSort options={['title', 'artist', 'difficulty', 'ranked', 'rating', 'plays', 'favorites', 'relevance']} onChange={(val, sort) => val && setSortQuery(`sort=${val}_${sort}`)} />
                  </div>

                  {/* Additional filters */}
                  {unfolded && <div className="flex items-start justify-evenly lgx:justify-between mt-6 text-[15px]">

                     <div className="flex flex-col gap-2.5 w-[290px]">
                        <div>
                           <h2 className="font-medium text-base">Song characteristics</h2>
                           <hr className="text-main-border border-1"></hr>
                        </div>
                        <section className="flex items-center justify-between">
                           <h4>Length</h4>
                           <FilterSelector min={0} max={1800} step={10} type="number" onChange={(val, filter) => createQueryString('length', filter, val)} />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>BPM</h4>
                           <FilterSelector min={0} max={500} step={10} type="number" onChange={(val, filter) => createQueryString('bpm', filter, val)} />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>Source</h4>
                           <Switch options={['movie', 'video game', 'series', 'event']} onChange={(val) => createQueryString('source', 'eq', val)} disabled />
                        </section>
                     </div>

                     <div className="flex flex-col gap-2.5 w-[300px]">
                        <div>
                           <h2 className="font-medium text-base">Beatmap characteristics</h2>
                           <hr className="text-main-border border-1"></hr>
                        </div>
                        <section className="flex items-center justify-between">
                           <h4>Approach rate</h4>
                           <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('ar', filter, val)} />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>Circle size</h4>
                           <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('cs', filter, val)} />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>Overall difficulty</h4>
                           <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('od', filter, val)} />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>HP drain rate</h4>
                           <FilterSelector min={0} max={10} step={1} type="number" onChange={(val, filter) => createQueryString('hp', filter, val)} />
                        </section>
                     </div>

                     <div className="flex-col gap-2.5 w-[310px] hidden lgx:flex">
                        <div>
                           <h2 className="font-medium text-base">Date characteristics</h2>
                           <hr className="text-main-border border-1"></hr>
                        </div>
                        <section className="flex items-center justify-between">
                           <h4>Created at</h4>
                           <FilterSelector type="date" onChange={(value) => console.log(value)} disabled />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>Updated size</h4>
                           <FilterSelector type="date" onChange={(value) => console.log(value)} disabled />
                        </section>
                        <section className="flex items-center justify-between">
                           <h4>Ranked at</h4>
                           <FilterSelector type="date" onChange={(value) => console.log(value)} disabled />
                        </section>
                     </div>

                  </div>}
               </div>

               {/* content */}
               <div className="flex p-4 gap-4 flex-wrap bg-darker overflow-y-auto">
                  {beatmapsetQueries.filter(q => q.data && q.data.beatmapsets.length).map((q, i) => {
                     if (q.data.beatmapsets.length > 1) return <OsuCardSet key={i} beatmapsets={q.data.beatmapsets} sortQuery={sortQuery || 'sort=relevance_asc'} className="flex-grow animate-in fade-in shadow-sm" />
                     else return <OsuCard key={i} beatmapset={q.data.beatmapsets[0]} className="flex-grow animate-in fade-in shadow-sm" />
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
      </div>
   )
}