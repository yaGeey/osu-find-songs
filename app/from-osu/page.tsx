'use client'
import { useEffect, useMemo, useState } from "react";
import { SongData, SongDataQueried } from "@/types/types";
import { searchSongWithConditions } from "@/lib/Spotify";
import Image from "next/image";
import Card from "@/components/cards/Card";
import Info from "@/components/Info";
import { twMerge as tw } from "tailwind-merge";
import dynamic from "next/dynamic";
import { useQueries } from "@tanstack/react-query";
import { Track } from "@/types/Spotify";
import { getBeatmap } from "@/lib/osu";
import { BeatmapSet } from "@/types/Osu";
import { groupOptions, sortOptions, selectStyles } from "@/utils/selectOptions";
import './page.css';
import BgImage from "@/components/BgImage";
import { useSongContext } from "@/contexts/SongContext";
import SettingsPopup from "@/components/SettingsPopup";
import { useRouter } from "next/navigation";
import CreatePlaylistButton from "@/components/CreatePlaylistButton";
import GroupSeparator from "@/components/GroupSeparator";
import TextSwitch from "@/components/TextSwitch";
import HomeBtn from "@/components/buttons/HomeBtn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownWideShort, faArrowUpShortWide, faSearch } from "@fortawesome/free-solid-svg-icons";
import { filterFn, searchFilterFn, groupArray } from "@/utils/arrayManaging";
import Progress from "@/components/state/Progress";
import DynamicBg from "@/components/DynamicBg";
const Select = dynamic(() => import('react-select'), { ssr: false });

export default function FromOsu() {
   const router = useRouter();
   const { songs } = useSongContext();
   useEffect(() => {
      if (!songs.length) router.push('from-osu/select');
   }, [songs]);

   const [info, setInfo] = useState<SongData | null>(null);
   const [filters, setFilters] = useState<string[]>([]);
   const [groupFn, setGroupFn] = useState<string>('no');
   const [sortFn, setSortFn] = useState('sort-date');
   const [isSettingsVisible, setIsSettingsVisible] = useState(false);
   const [groupedDict, setGroupedDict] = useState<any>(undefined);
   const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
   const [search, setSearch] = useState('');

   useEffect(() => {
      setInfo(null);
   }, [filters, groupFn, sortFn]);

   // queries
   const songQueries = useQueries({
      queries: songs.map((song) => ({
         queryKey: ['spotify', song.id],
         queryFn: async (): Promise<Track[] | null> => {
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
   
   // Combine the arrays
   const combinedArray = useMemo(() => {
      return songs.map((song, i) => ({
         local: song,
         spotifyQuery: songQueries[i],
         beatmapsetQuery: beatmapsetQueries[i],
      }))
   }, [songs, beatmapsetQueries.filter(q => q.isLoading).length, songQueries.filter(q => q.isLoading).length]);
   const isLoading = combinedArray.some(q => q.spotifyQuery.isLoading || q.beatmapsetQuery.isLoading);

   // Grouping and sorting
   useEffect(() => {
      if (isLoading) {
         setGroupedDict({ '': combinedArray });
         return;
      };
      const sortedGroupedArray = groupArray(groupFn, sortOrder, sortFn, combinedArray);
      setGroupedDict(sortedGroupedArray);
   }, [groupFn, sortFn, sortOrder, combinedArray, beatmapsetQueries.filter(q => q.isLoading).length, songQueries.filter(q => q.isLoading).length]);

   function handleCardClick(props: SongData) {
      if (info?.local.id === props.local.id) setInfo(null);
      else setInfo({ ...props });
   }

   return (
      <div className="overflow-y-hidden max-h-screen min-w-[600px] min-h-[670px]">
         <DynamicBg src={info?.local.image} />
         <Progress isLoading={isLoading} value={((combinedArray.filter(q => !q.beatmapsetQuery.isLoading).length + combinedArray.filter(q => !q.spotifyQuery.isLoading).length) * 100) / (combinedArray.length*2)} />

         <header className="bg-triangles border-b-4 border-main-border w-screen h-14 flex justify-between items-center px-4 gap-3">
            <section className="flex gap-3 items-center min-w-fit">
               <HomeBtn />
               <Image src="/icons/settings.svg" width={30} height={30} alt="settings" onClick={() => setIsSettingsVisible(p => !p)}
                  //TODO Зробити щоб можна змінювалась коли isSettingsVisible. Тре svg не імпорт а в окремий компонент можна
                  className={tw("hover:animate-spin hover:duration-2000 cursor-pointer", isSettingsVisible && 'brightness-130')}
               />
            </section>
            <hr className="border-2 border-main-border h-3/4"></hr>
            {isSettingsVisible && <SettingsPopup />}

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
               <Select className='lg:w-[200px] min-w-[75px] w-fit z-1'
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
               <Select className='lg:w-[200px] min-w-[75px] w-fit z-1'
                  onChange={(e: any) => setSortFn(e.value)}
                  id="sort-select"
                  options={sortOptions}
                  isDisabled={isLoading}
                  styles={selectStyles}
               />
               <TextSwitch
                  options={[
                     {
                        value: 'asc',
                        label: <FontAwesomeIcon icon={faArrowUpShortWide} /> 
                     },
                     {
                        value: 'desc',
                        label: <FontAwesomeIcon icon={faArrowDownWideShort} />
                     },
                  ]}
                  selected={sortOrder}
                  setSelected={(value: string) => setSortOrder(value as 'asc' | 'desc')}
                  className="h-[34px] ml-1"
               />
            </div>
            <hr className="border-2 border-main-border h-3/4"></hr>
            <div className="relative">
               <input type="text" className="bg-white rounded-lg h-[34px] px-3 outline-none text-[14px] w-[250px]" placeholder="Search" onChange={(e)=>setSearch(e.target.value)}/>
               <FontAwesomeIcon icon={faSearch} className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 text-lg" />
            </div>
         </header>

         {/* content */}
         <main className="max-h-[calc(100dvh-108px)] flex justify-center sm:justify-end">
            <div className="h-[calc(100dvh-108px)] absolute top-0 left-0 flex justify-center items-center z-1 mt-[56px]">
               {info && <Info data={info} onClose={() => setInfo(null)} />}
            </div>

            <ul className="flex flex-col pt-3 overflow-y-auto scrollbar">
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
                        <ul className="flex flex-col gap-2 items-end ">
                           {groupedDict[group].filter(filterFn(filters)).filter(searchFilterFn(search)).map((songData: SongDataQueried, i: number) => (
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

         <footer className="absolute bottom-0 left-0 bg-main border-t-4 border-main-border w-screen h-13 flex justify-center items-center px-8 gap-8 z-100">
            <CreatePlaylistButton songQueries={songQueries} className="w-[215px] py-1" />
            {/* <SharePlaylistButton data={combinedArray} className="w-[215px] py-1" /> */}
         </footer>
      </div>
   );
}