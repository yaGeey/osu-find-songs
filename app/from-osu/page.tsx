'use client'
import { useEffect, useMemo, useState } from 'react'
import { CombinedSingleSimple } from '@/types/types'
import Image from 'next/image'
import Info from './_components/Info'
import { twMerge as tw } from 'tailwind-merge'
import { useQueries } from '@tanstack/react-query'
import { Track } from '@/types/Spotify'
import { BeatmapSet } from '@/types/Osu'
import { groupOptions } from '@/utils/selectOptions'
import { useSongContext } from '@/contexts/SongContext'
import SettingsPopup from '@/components/SettingsPopup'
import { useRouter } from 'next/navigation'
import CreatePlaylistButton from './_components/CreatePlaylistButton'
import HomeBtn from '@/components/buttons/HomeBtn'
import { filterFn, searchFilterFn, groupArray, chunkArray, flatCombinedArray } from '@/utils/arrayManaging'
import Progress from '@/components/state/Progress'
import axios from 'axios'
import Cookies from 'js-cookie'
import useTimeLeft from '@/hooks/useTimeLeft'
import Dropdown from '@/components/selectors/Dropdown'
import DropdownSort from '@/components/selectors/DropdownSort'
import Search from '@/components/Search'
import Toggle from '@/components/Toggle'
import { FO_CHUNK_SIZE } from '@/variables'
import useFoTelemetry from '../../hooks/useFoTelemetry'
import useFoStore from '@/contexts/useFoStore'
import VirtuosoCardFO from './_components/VirtuosoCardFO'
import { motion, AnimatePresence } from 'framer-motion'
import BgImage from '@/components/BgImage'
import IconsSection from '@/components/IconsSection'
import { Settings } from 'lucide-react'

export type ListItem = { type: 'group'; key: string } | { type: 'card'; data: CombinedSingleSimple }

export default function FromOsu() {
   const router = useRouter()
   const { songs, setSongs } = useSongContext()
   useEffect(() => {
      if (!songs.length) router.replace('/from-osu/select')
   }, [songs, setSongs, router])
   const chunkedLocal = useMemo(() => chunkArray(songs, FO_CHUNK_SIZE), [songs])

   const sortFnName = useFoStore((state) => state.sortFnName)
   const selectedGroup = useFoStore((state) => state.selectedGroup)
   const current = useFoStore((state) => state.current)

   const [exactSpotify, setExactSpotify] = useState(false)
   const [groupFn, setGroupFn] = useState<string>('no')
   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
   const [search, setSearch] = useState('')

   const isLoggedWithSpotify = useMemo(() => {
      return Cookies.get('spotify_oauth_access_token') !== undefined
   }, [])

   useEffect(() => {
      useFoStore.setState({ current: null })
   }, [exactSpotify, groupFn, sortFnName])

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
   const isSpotifyFetching = spotifyQueries.some((q) => q.isFetching)

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
   const isOsuFetching = osuQueries.some((q) => q.isFetching)

   const isLoading = isOsuFetching || isSpotifyFetching

   // Re-fetch osu and spotify queries if any of them has null data
   // TODO why?
   useEffect(() => {
      osuQueries.forEach((query) => {
         if (query.data?.some((bs) => bs === null)) query.refetch()
      })
      spotifyQueries.forEach((query) => {
         if (query.data?.some((tracks) => tracks === null)) query.refetch()
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

   const groupedDict = useMemo(() => {
      const flattened = combined.flatMap((item) => flatCombinedArray(item))
      if (isLoading) return { '': flattened }
      return groupArray(groupFn, sortOrder, sortFnName, flattened)
   }, [groupFn, sortFnName, sortOrder, combined, isLoading])

   // prepara data for virtuoso
   const virtualListItems = useMemo(() => {
      const items: ListItem[] = []

      for (const group of Object.keys(groupedDict || {})) {
         if (group !== '') items.push({ type: 'group', key: group })

         if (group === '' || group === selectedGroup) {
            const filtered = groupedDict[group].filter(filterFn(exactSpotify)).filter(searchFilterFn(search))
            filtered.forEach((data) => {
               items.push({ type: 'card', data })
            })
         }
      }

      return items
   }, [groupedDict, selectedGroup, exactSpotify, search])

   // Telemetry
   useFoTelemetry({
      spotifyQueries,
      osuQueries,
      songsLength: songs.length,
   })

   const src = useFoStore((state) => (state.current ? state.current.local.image : undefined))
   return (
      <div className="overflow-hidden" translate="no">
         <AnimatePresence>
            {src && (
               <motion.div
                  key={src}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="-z-9 pointer-events-none fixed inset-0"
               >
                  <BgImage image={src} />
               </motion.div>
            )}
         </AnimatePresence>

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

         <header className="bg-triangles [--color-dialog:var(--color-main])] border-b-4 border-main-border w-screen h-12 flex justify-between items-center px-4 gap-3">
            <section className="flex gap-3 items-center min-w-fit">
               <IconsSection />
               <Settings
                  className={tw(
                     'size-[30px] hover:animate-spin hover:duration-2000 cursor-pointer',
                     isSettingsVisible && 'animate-spin duration-2000',
                  )}
                  onClick={() => setIsSettingsVisible((p) => !p)}
               />
               <CreatePlaylistButton
                  data={combined
                     .flatMap((item) => flatCombinedArray(item))
                     .filter((item) => item.spotify !== null)
                     .map((item) => item.spotify as Track[])}
                  isDisabled={!isLoggedWithSpotify || isLoading}
                  data-tooltip-id={!isLoggedWithSpotify || isLoading ? 'tooltip' : undefined}
                  data-tooltip-content={
                     isLoggedWithSpotify
                        ? 'Wait for the Spotify data to load'
                        : 'Log in to your Spotify account on a previous page to create a playlist'
                  }
               />
            </section>
            <SettingsPopup className={!isSettingsVisible ? '-left-full' : ''} />
            <section className="flex gap-2">
               <Toggle
                  value={exactSpotify}
                  setValue={setExactSpotify}
                  disabled={isLoading}
                  text={{ on: 'Exact Spotify match', off: 'Any Spotify match' }}
                  width={175}
                  className="max-[1075px]:!hidden"
               />
               <Dropdown
                  onSelected={(option) => {
                     console.log(option.value)
                     setGroupFn(option.value ?? 'no')
                  }}
                  placeholder="Group by"
                  options={groupOptions}
                  disabled={isLoading}
                  width={100}
               />
               <DropdownSort
                  onSelected={({ query, order }) => {
                     useFoStore.setState({ sortFnName: query ?? 'sort-date' })
                     setSortOrder(order)
                  }}
               />
               <Search value={search} setValue={setSearch} placeholder="Search songs" width={200} disabled={isLoading} />
            </section>
         </header>

         {/* content */}
         <main className="max-h-[calc(100dvh-48px)] flex justify-center sm:justify-end">
            <div className="h-[calc(100dvh-48px)] absolute top-0 left-0 flex justify-center items-center z-1 mt-12">
               <AnimatePresence>
                  {current && (
                     <motion.div
                        key="modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                     >
                        <Info data={current} />
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
            <VirtuosoCardFO data={virtualListItems} />
         </main>
      </div>
   )
}
