'use client'
import { useEffect, useRef, useState } from "react";
import { Song, SongData, SongDataQueried } from "@/types/types";
import { AddItemsToPlaylist, createPlaylist, findSong, revalidateSpotifyToken, searchSongWithConditions } from "@/utils/Spotify";
import Image from "next/image";
import Card from "@/components/Card";
import Info from "@/components/Info";
import { twMerge as tw } from "tailwind-merge";
import dynamic from "next/dynamic";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import DebugButtons from "@/components/Debug";
import { Track } from "@/types/Spotify";
import { getBeatmap } from "@/utils/osu";
import { BeatmapSet } from "@/types/Osu";
import { filterOptions, groupOptions, languageOptions, sortOptions } from "@/utils/selectOptions";
// import gsap from "gsap";
// import { useGSAP } from "@gsap/react";
import './page.css';
import BgImage from "@/components/BgImage";
import { useSongContext } from "@/contexts/SongContext";
import SettingsPopup from "@/components/SettingsPopup";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import CreatePlaylistButton from "@/components/CreatePlaylistButton";
import { Button } from "@/components/Buttons";
const Select = dynamic(() => import('react-select'), { ssr: false });

// gsap.registerPlugin(useGSAP);

export default function Home() {
   const router = useRouter();
   const { songs } = useSongContext();
   useEffect(() => {
      if (!songs.length) router.push('playlist/select');
   }, [songs]);

   const [info, setInfo] = useState<SongData | null>(null);
   const [currentSong, setCurrentSong] = useState<HTMLElement | null>(null);
   const [group, setGroup] = useState<string>('no');
   const [filters, setFilters] = useState<string[]>([]);
   const [sortFn, setSortFn] = useState('sort-title');
   const [isInfoVisible, setIsInfoVisible] = useState(false);
   const [isSettingsVisible, setIsSettingsVisible] = useState(false);

   // select animation
   useEffect(() => {
      if (info) {
         const song = document.getElementById(info?.local.id)
         if (song) {
            if (currentSong !== song) {
               if (currentSong) {
                  currentSong.className = tw(currentSong.className, 'mr-0 bg-song -mt-3 mb-0');
               }
               song.className = tw(song.className, 'mr-24 bg-song-select -mt-1 mb-2');
               setCurrentSong(song);
               setIsInfoVisible(false);
            } else {
               currentSong.className = tw(currentSong.className, 'mr-0 bg-song -mt-3 mb-0')
               setCurrentSong(null);
               setInfo(null);
               setIsInfoVisible(true);
            }
         }
      } else {
         if (currentSong) {
            currentSong.className = tw(currentSong.className, 'mr-0 bg-song -mt-3 mb-0')
            setCurrentSong(null);
         }
      }
   }, [info]);

   useEffect(() => {
      setInfo(null);
   }, [filters, group, sortFn]);

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
   const combinedArray = songs.map((song, i) => ({
      local: song,
      spotifyQuery: songQueries[i],
      beatmapsetQuery: beatmapsetQueries[i],
   }));

   //! Add to card current sort value
   const sortedCombinedArray = combinedArray.sort((a, b) => {
      const aData = a.beatmapsetQuery.data;
      const bData = b.beatmapsetQuery.data;

      if (!aData || !bData) return 0; // Якщо дані відсутні, не змінюємо порядок

      switch (sortFn) {
         case 'sort-artist': return aData.artist.localeCompare(bData.artist);
         case 'sort-bpm': return aData.bpm - bData.bpm;
         case 'sort-creator': return aData.creator.localeCompare(bData.creator);
         case 'sort-date': return 0;
         case 'sort-date-mapped': return new Date(aData.submitted_date).getTime() - new Date(bData.submitted_date).getTime();
         // case 'sort-dif': return aData.difficulty - bData.difficulty;
         case 'sort-length': return aData.beatmaps[0].total_length - bData.beatmaps[0].total_length;
         case 'sort-title': return aData.title.localeCompare(bData.title);
      }
      return 0;
   });

   const filterFn = (a: SongDataQueried) => {
      if (!filters.length) return true;

      return filters.every(filter => {
         switch (filter) {
            case 'exact-spotify': return a.spotifyQuery.data?.length !== 20;
         }
      });
   };

   return (
      <div className="overflow-y-hidden max-h-screen">
         <BgImage image={info?.local.image} />

         <header className="bg-main border-b-4 border-main-border w-screen h-14 flex justify-between items-center px-4">
            <section className="flex gap-3 items-center">
               {/* Може анімашку, але там бібліотека душна якась хз https://icons8.com/icon/set/home/ios */}
               <Link href="/">
                  <Image src="/icons/home.svg" width={30} height={30} alt="settings" className="hover:scale-110 transition-all"/>
               </Link>
               <Image src="/icons/settings.svg" width={30} height={30} alt="settings" onClick={() => setIsSettingsVisible(p => !p)}
                  // Зробити щоб можна змінювалась коли isSettingsVisible. Тре svg не імпорт а в окремий компонент можна
                  className={tw("hover:animate-spin hover:duration-2000 cursor-pointer", isSettingsVisible && 'brightness-130')}
               />
            </section>
            <div className="border-l-3 border-l-main-border h-3/4 -ml-27"></div>
            {isSettingsVisible &&
               <SettingsPopup isOpen={isSettingsVisible} />
            }

            {/* <div className="flex gap-3 w-1/4 items-center">
               <label className="text-md" htmlFor="group-select">Group</label>
               <Select className='w-full'
                  onChange={(e: any) => setGroup(e.value)}
                  id="group-select"
                  defaultValue={groupOptions[0]}
                  options={groupOptions}
               />
            </div> */}
            {/* <Button onClick={() => handleCreatePlaylist()}>Create playlist with tracks</Button> */}
            <CreatePlaylistButton songQueries={songQueries} />
            <div className="flex gap-3 w-1/4 items-center">
               <label className="text-md" htmlFor="filter-select">Filters</label>
               <Select className='w-full'
                  onChange={(e: any) => setFilters(e.map((f: any) => f.value))}
                  isMulti
                  id="filter-select"
                  options={filterOptions}
               />
            </div>
            <div className="flex gap-3 w-1/4 items-center">
               <label className="text-md" htmlFor="sort-select">Sort</label>
               <Select className='w-full'
                  onChange={(e: any) => setSortFn(e.value)}
                  id="sort-select"
                  defaultValue={sortOptions[4]}
                  options={sortOptions}
               />
            </div>
         </header>

         <main className="flex justify-between max-h-[calc(100dvh-56px)]">
            <div className="h-[calc(100dvh-56px)] flex items-center justify-center">
               {info && <Info data={info} isVisible={isInfoVisible} /> || <div className="w-1/2"></div>}
            </div>

            <ul className="flex flex-col pt-3 overflow-y-auto items-end">
               {sortedCombinedArray && sortedCombinedArray.filter(filterFn).map((songData, i) => (
                  <Card
                     data={songData}
                     sortFn={sortFn}
                     key={i}
                     className='-mt-3'
                     onClick={(props: SongData) => setInfo({ ...props })} />
               ))}
            </ul>
         </main>

         <div id="footer-hover-trigger" className="absolute bottom-0 left-0 w-full h-8 z-10 flex justify-center items-center hover:h-13"></div>
         <footer className="footer bg-main border-t-4 border-main-border w-screen h-14 flex justify-between items-center px-8">
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-400/80 w-fit text-3xl/3 pb-4 px-4 rounded-t-xl select-none">...</div>
            <DebugButtons songs={songs} />
         </footer>
      </div>
   );
}