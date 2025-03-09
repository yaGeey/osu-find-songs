'use client'
import { useEffect, useRef, useState } from "react";
import { CSSObject } from "@emotion/react";
import { Song, SongData, SongDataQueried } from "@/types/types";
import { AddItemsToPlaylist, createPlaylist, findSong, revalidateSpotifyToken, searchSongWithConditions } from "@/lib/Spotify";
import Image from "next/image";
import Card from "@/components/cards/Card";
import Info from "@/components/Info";
import { twMerge as tw } from "tailwind-merge";
import dynamic from "next/dynamic";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import DebugButtons from "@/components/Debug";
import { Track } from "@/types/Spotify";
import { getBeatmap } from "@/lib/osu";
import { BeatmapSet } from "@/types/Osu";
import { filterOptions, groupOptions, languageOptions, sortOptions } from "@/utils/selectOptions";
// import gsap from "gsap";
// import { useGSAP } from "@gsap/react";
import './page.css';
import BgImage from "@/components/BgImage";
import { useSongContext } from "@/contexts/SongContext";
import SettingsPopup from "@/components/SettingsPopup";
import { redirect, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CreatePlaylistButton from "@/components/CreatePlaylistButton";
import GroupSeparator from "@/components/GroupSeparator";
import TextSwitch from "@/components/TextSwitch";
import Modal from "@/components/Modal";
import Head from "next/head";
import HomeBtn from "@/components/buttons/HomeBtn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownWideShort, faArrowUpShortWide, faSearch } from "@fortawesome/free-solid-svg-icons";
import SharePlaylistButton from "@/components/SharePlaylistButton";
import { ToastContainer, toast } from 'react-toastify';
const Select = dynamic(() => import('react-select'), { ssr: false });
// gsap.registerPlugin(useGSAP);

const selectStyles = {
   control: (base: CSSObject) => ({
      ...base,
      height: 35,
      minHeight: 35,
      fontSize: '14px',
      borderRadius: '8px',
   }),
   menu: (base: CSSObject) => ({
      ...base,
      fontSize: '14px',
   }),
};

export default function Home() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const pathname = usePathname();
   const { songs: initialSongs } = useSongContext();
   const [songs, setSongs] = useState<Song[]>(initialSongs);

   useEffect(() => {
      if (!songs.length && !searchParams.has('id')) {
         console.warn('zzzzzzz???')
         // router.push('from-osu/select');
      };
   }, [songs]);
   
   const playlistQuery = useQuery({
      queryKey: ['beatmapsets', searchParams.get('id')],
      queryFn: async () => {
         const res = await fetch(`/api/playlist?id=${searchParams.get('id')}`);
         const data = await res.json();
         console.log(data)
         return data;
      },
      enabled: searchParams.has('id'),
   });
   useEffect(() => {
      if (playlistQuery.isLoading) return;
      if (!playlistQuery.data && !playlistQuery.isLoading && !songs.length && searchParams.has('id')) {
         console.log(playlistQuery.data, playlistQuery.isLoading, songs.length, searchParams.has('id') )
         // router.push('from-osu/select');
      };
      if (playlistQuery.data) setSongs(playlistQuery.data.beatmapsets.map((id: string) => (
         { id, image: '', title: '', author: '', text: ''}
      )));
   }, [playlistQuery.data, playlistQuery.isLoading]);

   const [info, setInfo] = useState<SongData | null>(null);
   const [filters, setFilters] = useState<string[]>([]);
   const [groupFn, setGroupFn] = useState<string>('no');
   const [sortFn, setSortFn] = useState('sort-title');
   const [isSettingsVisible, setIsSettingsVisible] = useState(false);
   const [groupedDict, setGroupedDict] = useState<any>(undefined);
   const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

   useEffect(() => {
      setInfo(null);
   }, [filters, groupFn, sortFn]);

   const songQueries = useQueries({
      queries: songs.map((song) => ({
         queryKey: ['spotify', song.id],
         queryFn: async (): Promise<Track[] | null> => {
            console.log('searching', song.id)
            const tracks = await searchSongWithConditions(song);
            if (!tracks?.length) return null;
            return tracks;
         },
         cacheTime: 1000 * 60 * 60 * 24,
      }))
   });

   const beatmapsetQueries = useQueries({
      queries: songs.map((song) => ({
         queryKey: ['beatmap', song.id],
         queryFn: (): Promise<BeatmapSet> => getBeatmap(song.id),
         cacheTime: 1000 * 60 * 60 * 24,
      }))
   });

   useEffect(() => {
      console.log(songs)
      songQueries.forEach(q => q.refetch());
      beatmapsetQueries.forEach(q => q.refetch());
   }, [playlistQuery.data]);

   // Combine the arrays
   const combinedArray = songs.map((song, i) => ({
      local: song,
      spotifyQuery: songQueries[i],
      beatmapsetQuery: beatmapsetQueries[i],
   }));
   const isLoading = combinedArray.some(q => q.spotifyQuery.isLoading || q.beatmapsetQuery.isLoading);

   // Grouping and sorting
   useEffect(() => {
      let groupedArray;
      if (isLoading) {
         setGroupedDict({ '': combinedArray });
         return;
      };

      // Grouping
      if (groupFn === 'year') {
         groupedArray = Object.groupBy(combinedArray, (q) => q.beatmapsetQuery.data?.submitted_date?.split('-')[0]!);
      } else if (groupFn === 'genre') {
         groupedArray = Object.groupBy(combinedArray, (q) => q.beatmapsetQuery.data?.genre.name!);
      } else if (groupFn === 'length') {
         groupedArray = Object.groupBy(combinedArray, (q) => {
            const length = q.beatmapsetQuery.data?.beatmaps[0].total_length!;
            if (length < 60) return '< 1 minute';
            if (length < 120) return '1 - 2 minutes';
            if (length < 300) return '2 - 5 minutes';
            if (length < 600) return '5 - 10 minutes';
            return '> 10 minutes';
         });
      } else if (groupFn === 'artist') {
         groupedArray = Object.groupBy(combinedArray, (q) => q.beatmapsetQuery.data?.artist!);
      } else if (groupFn === 'bpm') {
         groupedArray = Object.groupBy(combinedArray, (q) => {
            const bpm = q.beatmapsetQuery.data?.bpm!;
            if (bpm < 100) return '< 100 bpm';
            if (bpm < 200) return '100 - 200 bpm';
            if (bpm < 300) return '200 - 300 bpm';
            return '> 300 bpm';
         });
      } else if (groupFn === 'no') {
         groupedArray = { '': combinedArray };
      } else {
         groupedArray = { '': combinedArray };
      }

      // Sort each group
      const sortedGroupedArray = Object.entries(groupedArray).reduce((acc, [key, value]) => {
         const sortedArray = value.sort((a, b) => {
            const aData = sortOrder == 'desc' ? a.beatmapsetQuery.data : b.beatmapsetQuery.data;
            const bData = sortOrder == 'desc' ? b.beatmapsetQuery.data : a.beatmapsetQuery.data;
            if (!aData || !bData) return 0;

            switch (sortFn) {
               case 'sort-artist': return aData.artist.localeCompare(bData.artist);
               case 'sort-bpm': return aData.bpm - bData.bpm;
               case 'sort-creator': return aData.creator.localeCompare(bData.creator);
               case 'sort-date': return 0;
               case 'sort-date-mapped': return new Date(aData.submitted_date).getTime() - new Date(bData.submitted_date).getTime();
               // case 'sort-dif': return aData.difficulty - bData.difficulty;
               case 'sort-length': return aData.beatmaps[0].total_length - bData.beatmaps[0].total_length;
               case 'sort-title': return aData.title.localeCompare(bData.title);
               default: return 0;
            }
         });

         acc[key] = sortedArray;
         return acc;
      }, {} as Record<string, typeof combinedArray>);

      setGroupedDict(sortedGroupedArray);
   }, [groupFn, sortFn, sortOrder, beatmapsetQueries.filter(q => q.isLoading).length, songQueries.filter(q => q.isLoading).length, playlistQuery.data]);

   // filters
   const filterFn = (a: SongDataQueried) => {
      if (!filters.length) return true;

      return filters.every(filter => {
         switch (filter) {
            case 'exact-spotify': return a.spotifyQuery.data?.length !== 20;
         }
      });
   };

   function handleCardClick(props: SongData) {
      if (info?.local.id === props.local.id) setInfo(null);
      else setInfo({ ...props });
   }

   return (
      <div className="overflow-y-hidden max-h-screen min-w-[600px] min-h-[670px]">
         <BgImage image={info?.local.image} />

         {isLoading && <progress
            className="w-screen h-3 mb-2"
            value={combinedArray.filter(q => !q.beatmapsetQuery.isLoading && !q.spotifyQuery.isLoading).length}
            max={combinedArray.length}
         ></progress>}

         <header className={tw(
            "bg-main border-b-4 border-main-border w-screen h-14 flex justify-between items-center px-4 gap-3",
            isLoading && '-mt-3.5 border-t-4'
         )}>
            <section className="flex gap-3 items-center min-w-fit">
               <HomeBtn />
               <Image src="/icons/settings.svg" width={30} height={30} alt="settings" onClick={() => setIsSettingsVisible(p => !p)}
                  // Зробити щоб можна змінювалась коли isSettingsVisible. Тре svg не імпорт а в окремий компонент можна
                  className={tw("hover:animate-spin hover:duration-2000 cursor-pointer", isSettingsVisible && 'brightness-130')}
               />
            </section>
            <hr className="border-2 border-main-border h-3/4"></hr>
            {isSettingsVisible && <SettingsPopup isOpen={isSettingsVisible} />}

            {/* <CreatePlaylistButton songQueries={songQueries} /> */}

            <div className="flex 2xl:gap-3 gap-1.5 items-center justify-center ">
               <label className="font-semibold hidden lgx:block" htmlFor="filter-select">Exact Spotify match</label>
               <input
                  type="checkbox"
                  id="filter-select"
                  onChange={(e) => setFilters(e.target.checked ? ['exact-spotify'] : [])}
                  className="mt-1 w-4 h-4 accent-main-border"
               />
            </div>
            <div className="flex gap-3 justify-center items-center ">
               <label className="text-md font-semibold tracking-wider hidden xl:block" htmlFor="group-select">Group</label>
               <Select className='lg:w-[200px] min-w-[75px] w-fit z-10'
                  onChange={(e: any) => setGroupFn(e.value)}
                  id="group-select"
                  defaultValue={groupOptions[0]}
                  options={groupOptions}
                  isDisabled={isLoading}
                  styles={selectStyles}
               />
            </div>
            <hr className="border-2 border-main-border h-3/4"></hr>
            <div className="flex gap-3 items-center justify-end">
               <label className="text-md font-semibold tracking-wider hidden lgx:block" htmlFor="sort-select">Sort</label>
               <Select className='lg:w-[200px] min-w-[75px] w-fit z-10'
                  onChange={(e: any) => setSortFn(e.value)}
                  id="sort-select"
                  defaultValue={sortOptions[4]}
                  options={sortOptions}
                  isDisabled={isLoading}
                  styles={selectStyles}
               />
               <TextSwitch
                  options={[
                     {
                        value: 'desc',
                        label: <FontAwesomeIcon icon={faArrowDownWideShort} />
                     },
                     {
                        value: 'asc',
                        label: <FontAwesomeIcon icon={faArrowUpShortWide} />
                     },
                  ]}
                  selected={sortOrder}
                  setSelected={(value: string) => setSortOrder(value as 'asc' | 'desc')}
                  className="h-[34px] ml-1"
               />
            </div>
            <hr className="border-2 border-main-border h-3/4"></hr>
            <div className="relative">
               <input type="text" className="bg-white rounded-lg h-[34px] px-3 outline-none text-[14px] w-[250px]" placeholder="Search" />
               <FontAwesomeIcon icon={faSearch} className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 text-lg" />
            </div>
         </header>

         <main className="max-h-[calc(100dvh-56px)] flex justify-center sm:justify-end">
            <div className="h-[calc(100dvh-56px)] absolute top-0 left-0 flex justify-center items-center mt-[56px] z-10">
               {info && <Info data={info} onClose={() => setInfo(null)} />}
            </div>

            <ul className="flex flex-col pt-3 overflow-y-auto scrollbar-none mt-2">
               {groupedDict && Object.keys(groupedDict).map((group, i) => (
                  <div key={i} className="w-full flex flex-col items-end">
                     {group !== '' &&
                        <GroupSeparator
                           selected={group == selectedGroup}
                           onClick={() => setSelectedGroup(group === selectedGroup ? null : group)}
                           className="z-1"
                        >{group}</GroupSeparator>
                     }
                     {(group == selectedGroup || group === '') &&
                        <ul className="flex flex-col gap-2 items-end">
                           {groupedDict[group].filter(filterFn).map((songData: SongDataQueried, i: number) => (
                              <Card
                                 data={songData}
                                 sortFn={sortFn}
                                 key={i}
                                 className='-mt-3'
                                 selected={info?.local.id === songData.local.id}
                                 onClick={handleCardClick}
                              />
                           ))}
                        </ul>
                     }
                  </div>
               ))}
            </ul>
         </main>

         <footer className="absolute bottom-0 left-0 bg-main border-t-4 border-main-border w-screen h-13 flex justify-center items-center px-8 gap-8">
            <CreatePlaylistButton songQueries={songQueries} className="w-[215px] py-1" />
            <SharePlaylistButton data={combinedArray} className="w-[215px] py-1" />
         </footer>
         <ToastContainer />
      </div>
   );
}

{/* <div id="footer-hover-trigger" className="absolute bottom-0 left-0 w-full h-8 z-10 flex justify-center items-center hover:h-13"></div>
   <footer className="footer bg-main border-t-4 border-main-border w-screen h-14 flex justify-between items-center px-8">
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-400/80 w-fit text-3xl/3 pb-4 px-4 rounded-t-xl select-none">...</div>
      <DebugButtons songs={songs} />
</footer> */}