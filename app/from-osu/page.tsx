'use client'
import { use, useEffect, useMemo, useRef, useState } from 'react'
import { CombinedSingle, CombinedSingleSimple, SongData, SongDataQueried } from '@/types/types'
import Image from 'next/image'
import Card from './_components/Card'
import Info from './_components/Info'
import { twMerge as tw } from 'tailwind-merge'
import dynamic from 'next/dynamic'
import { useQueries } from '@tanstack/react-query'
import { Track } from '@/types/Spotify'
import { BeatmapSet } from '@/types/Osu'
import { groupOptions, sortOptions, selectStyles } from '@/utils/selectOptions'
import './page.css'
import { useSongContext } from '@/contexts/SongContext'
import SettingsPopup from '@/components/SettingsPopup'
import { useRouter } from 'next/navigation'
import CreatePlaylistButton from './_components/CreatePlaylistButton'
import GroupSeparator from './_components/GroupSeparator'
import TextSwitch from '@/components/TextSwitch'
import HomeBtn from '@/components/buttons/HomeBtn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDownWideShort, faArrowUpShortWide, faSearch } from '@fortawesome/free-solid-svg-icons'
import { filterFn, searchFilterFn, groupArray, chunkArray, mergeGroupedArrays, flatCombinedArray } from '@/utils/arrayManaging'
import Progress from '@/components/state/Progress'
import DynamicBg from './_components/DynamicBg'
import { Tooltip } from 'react-tooltip'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Virtuoso } from 'react-virtuoso'
import useTimeLeft from '@/hooks/useTimeLeft'
const Select = dynamic(() => import('react-select'), { ssr: false })

const CHUNK_SIZE = 10 // TODO make it dynamic depending on the songs length
// TODO! yyaaay it's working, but loading spinner breaks. fix this

export default function FromOsu() {
   const router = useRouter()
   let { songs, setSongs } = useSongContext()
   useEffect(() => {
      if (!songs.length) {
         router.push('/from-osu/select')
      }
   }, [songs, setSongs, router])
   const chunkedLocal = chunkArray(songs, CHUNK_SIZE)

   const [info, setInfo] = useState<CombinedSingleSimple | null>(null)
   const [filters, setFilters] = useState<string[]>([])
   const [groupFn, setGroupFn] = useState<string>('no')
   const [sortFn, setSortFn] = useState('sort-date')
   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
   const [groupedDict, setGroupedDict] = useState<Record<string, CombinedSingleSimple[]>>({ '': [] })
   const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
   const [search, setSearch] = useState('')

   const isLoggedWithSpotify = useMemo(() => {
      return Cookies.get('spotify_oauth_access_token') !== undefined
   }, [])

   useEffect(() => {
      setInfo(null)
   }, [filters, groupFn, sortFn])

   // queries
   const spotifyQueries = useQueries({
      queries: chunkedLocal.map((localChunk) => ({
         queryKey: ['spotifyChunk', localChunk.map((s) => s.id)],
         queryFn: async () => {
            const t0 = performance.now()
            const res = await axios.post<(null | Track[])[]>('/api/batch/spotify', localChunk)
            addTimeSpotify(performance.now() - t0)
            return res.data
         },
      })),
   })

   const osuQueries = useQueries({
      queries: chunkedLocal.map((localChunk) => ({
         queryKey: ['osuChunk', localChunk.map((s) => s.id)],
         queryFn: async () => {
            const t0 = performance.now()
            const res = await axios.get<BeatmapSet[] | null>(`/api/batch/osu`, {
               params: {
                  id: localChunk.map((s) => s.id),
               },
               paramsSerializer: { indexes: null },
            })
            addTimeOsu(performance.now() - t0)
            return res.data
         },
      })),
   })

   // Re-fetch osu and spotify queries if any of them has null data
   useEffect(() => {
      osuQueries.forEach((query) => {
         if (query.data?.some((bs) => !bs)) query.refetch()
      })
      spotifyQueries.forEach((query) => {
         if (query.data?.some((tracks) => !tracks)) query.refetch()
      })
   }, [])

   // Approximate loading time left
   const {
      addTimeLeft: addTimeSpotify,
      timeLeft: timeLeftSpotify,
      msLeft: msLeftSpotify,
   } = useTimeLeft(spotifyQueries.filter((q) => !q.isFetched).length)
   const {
      addTimeLeft: addTimeOsu,
      timeLeft: timeLeftOsu,
      msLeft: msLeftOsu,
   } = useTimeLeft(osuQueries.filter((q) => !q.isFetched).length)

   // Combine the arrays
   const combined = useMemo(() => {
      return chunkedLocal.map((localChunk, i) => ({
         local: localChunk,
         spotifyQuery: spotifyQueries[i],
         osuQuery: osuQueries[i],
      }))
   }, [
      songs,
      osuQueries.filter((q) => q.isLoading).length,
      spotifyQueries.filter((q) => q.isLoading).length,
      osuQueries.map((q) => q.dataUpdatedAt).join(','),
      spotifyQueries.map((q) => q.dataUpdatedAt).join(','),
   ])
   const isLoading = combined.some((q) => q.spotifyQuery.isLoading || q.osuQuery.isLoading)

   // Grouping and sorting
   useEffect(() => {
      const flattened = combined.flatMap((item) => flatCombinedArray(item))
      if (isLoading) {
         setGroupedDict({ '': flattened })
         return
      }
      // ) // TODO sort by popularity
      const sortedGroupedArray = groupArray(groupFn, sortOrder, sortFn, flattened)
      setGroupedDict(sortedGroupedArray)
   }, [
      groupFn,
      sortFn,
      sortOrder,
      combined,
      osuQueries.filter((q) => q.isLoading).length,
      spotifyQueries.filter((q) => q.isLoading).length,
   ])

   function handleCardClick(props: CombinedSingleSimple) {
      if (info?.local.id === props.local.id) setInfo(null)
      else setInfo({ ...props })
   }

   // for virtual list
   // TODO розібратися
   type ListItem = { type: 'group'; key: string } | { type: 'card'; data: CombinedSingleSimple }

   const virtualListItems: ListItem[] = useMemo(() => {
      const items: ListItem[] = []

      for (const group of Object.keys(groupedDict || {})) {
         if (group !== '') items.push({ type: 'group', key: group })

         if (group === '' || group === selectedGroup) {
            const filtered = groupedDict[group].filter(filterFn(filters)).filter(searchFilterFn(search))
            filtered.forEach((data) => {
               items.push({ type: 'card', data })
            })
         }
      }

      return items
   }, [groupedDict, selectedGroup, filters, search])

   return (
      <div className="overflow-y-hidden max-h-screen min-w-[600px] min-h-[670px]">
         <DynamicBg src={info?.local.image} />
         <Progress
            isVisible={isLoading}
            value={
               ((combined.filter((q) => !q.osuQuery.isLoading).length +
                  combined.filter((q) => !q.spotifyQuery.isLoading).length) *
                  100) /
               (combined.length * 2)
            }
         >
            {msLeftOsu > msLeftSpotify
               ? `${osuQueries.filter((q) => !q.isLoading).length}/${songs.length} | ${timeLeftOsu} left`
               : `${spotifyQueries.filter((q) => !q.isLoading).length}/${songs.length} | ${timeLeftSpotify} left`}
         </Progress>

         <header className="bg-triangles border-b-4 border-main-border w-screen h-14 flex justify-between items-center px-4 gap-3">
            <section className="flex gap-3 items-center min-w-fit">
               <HomeBtn />
               <Image
                  src="/icons/settings.svg"
                  width={30}
                  height={30}
                  alt="settings"
                  onClick={() => setIsSettingsVisible((p) => !p)}
                  //TODO Зробити щоб можна змінювалась коли isSettingsVisible. Тре svg не імпорт а в окремий компонент можна
                  className={tw('hover:animate-spin hover:duration-2000 cursor-pointer', isSettingsVisible && 'brightness-130')}
               />
            </section>
            <hr className="border-2 border-main-border h-3/4"></hr>
            <SettingsPopup className={!isSettingsVisible ? '-left-full' : ''} />

            <div
               className="flex 2xl:gap-3 gap-1.5 items-center justify-center "
               data-tooltip-id={isLoading ? 'tooltip' : undefined}
               data-tooltip-content="Wait for the beatmaps data to load"
            >
               <label className="font-semibold hidden lgx:block" htmlFor="filter-select">
                  Exact Spotify match
               </label>
               <input
                  type="checkbox"
                  id="filter-select"
                  onChange={(e) => setFilters(e.target.checked ? ['exact-spotify'] : [])}
                  className="mt-1 w-4 h-4 accent-main-border"
                  disabled={isLoading}
               />
            </div>
            <div
               className="flex gap-3 justify-center items-center "
               data-tooltip-id={isLoading ? 'tooltip' : undefined}
               data-tooltip-content="Wait for the beatmaps data to load"
            >
               <label className="text-md font-semibold tracking-wider hidden xl:block" htmlFor="group-select">
                  Group
               </label>
               <Select
                  className="lg:w-[200px] min-w-[75px] w-fit z-1"
                  onChange={(e: any) => setGroupFn(e.value)}
                  id="group-select"
                  defaultValue={groupOptions[0]}
                  options={groupOptions}
                  isDisabled={isLoading}
                  styles={selectStyles}
                  data-tooltip-id={isLoading ? 'tooltip' : undefined}
                  data-tooltip-content="Wait for the beatmaps data to load"
               />
            </div>
            <hr className="border-2 border-main-border h-3/4"></hr>
            <div
               className="flex gap-3 items-center justify-end"
               data-tooltip-id={isLoading ? 'tooltip' : undefined}
               data-tooltip-content="Wait for the beatmaps data to load"
            >
               <label className="text-md font-semibold tracking-wider hidden lgx:block" htmlFor="sort-select">
                  Sort
               </label>
               <Select
                  className="lg:w-[200px] min-w-[75px] w-fit z-1"
                  onChange={(e: any) => setSortFn(e.value)}
                  id="sort-select"
                  defaultValue={sortOptions[0]}
                  options={sortOptions}
                  isDisabled={isLoading}
                  styles={selectStyles}
               />
               <TextSwitch
                  options={[
                     {
                        value: 'asc',
                        label: <FontAwesomeIcon icon={faArrowUpShortWide} />,
                     },
                     {
                        value: 'desc',
                        label: <FontAwesomeIcon icon={faArrowDownWideShort} />,
                     },
                  ]}
                  selected={sortOrder}
                  setSelected={(value: string) => setSortOrder(value as 'asc' | 'desc')}
                  className="h-[34px] ml-1"
               />
            </div>
            <hr className="border-2 border-main-border h-3/4"></hr>
            <div className="relative">
               <input
                  type="text"
                  className="bg-white rounded-lg h-[34px] px-3 outline-none text-[14px] w-[250px]"
                  placeholder="Search"
                  onChange={(e) => setSearch(e.target.value)}
               />
               <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 text-lg"
               />
            </div>
         </header>

         {/* content */}
         <main className="max-h-[calc(100dvh-108px)] flex justify-center sm:justify-end">
            <div className="h-[calc(100dvh-108px)] absolute top-0 left-0 flex justify-center items-center z-1 mt-[56px]">
               {info && <Info data={info} onClose={() => setInfo(null)} />}
            </div>

            <Virtuoso
               key={virtualListItems.length}
               data={virtualListItems}
               //  TODO components={{}}
               itemContent={(index, item) => (
                  // TODO without wrapper no transition effect, but even with this padding top don't work.. why? and how virtuoso work
                  //? padding не робе, бо весь список симулюється через нього або translate-y
                  <div className={tw('flex justify-end w-full', virtualListItems.indexOf(item) === 0 && 'mt-3')}>
                     {item.type === 'group' ? (
                        <GroupSeparator
                           className="-mt-3"
                           selected={item.key === selectedGroup}
                           onClick={() => setSelectedGroup(item.key === selectedGroup ? null : item.key)}
                        >
                           {item.key}
                        </GroupSeparator>
                     ) : item.type === 'card' ? (
                        <Card
                           data={item.data}
                           sortFn={sortFn}
                           className="-mt-3 "
                           selected={info?.local.id === item.data.local.id}
                           onClick={handleCardClick}
                        />
                     ) : null}
                  </div>
               )}
               className="scrollbar w-full"
               style={{ height: 'calc(100dvh - 108px)' }} // 108px = header + footer height. doesn't changing
               overscan={300}
               defaultItemHeight={85} //  why do I need this?
            />
         </main>

         <footer className="absolute bottom-0 left-0 bg-main border-t-4 border-main-border w-screen h-13 flex justify-center items-center px-8 gap-8 z-100">
            <CreatePlaylistButton
               data={combined.flatMap((item) => flatCombinedArray(item)).map((item) => item.spotify)}
               className="w-[215px] py-1"
               isDisabled={!isLoggedWithSpotify || isLoading}
               data-tooltip-id={!isLoggedWithSpotify || isLoading ? 'tooltip' : undefined}
               data-tooltip-content={
                  isLoggedWithSpotify
                     ? 'Wait for the Spotify data to load'
                     : 'Log in to your Spotify account on a previous page to create a playlist'
               }
            />
         </footer>
         <Tooltip id="tooltip" place="bottom" style={{ fontSize: '13px', padding: '0 0.25rem', zIndex: 100000 }} />
      </div>
   )
}
