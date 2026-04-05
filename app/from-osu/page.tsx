'use client'
import { useEffect, useMemo, useState } from 'react'
import { CombinedSingleSimple } from '@/types/types'
import Info from './_components/Info'
import { twMerge as tw } from 'tailwind-merge'
import { groupOptions, GroupOptionValue } from '@/utils/selectOptions'
import { useSongContext } from '@/contexts/SongContext'
import SettingsPopup from '@/components/SettingsPopup'
import { useRouter } from 'next/navigation'
import CreatePlaylistButton from './_components/CreatePlaylistButton'
import { filterFn, searchFilterFn, chunkArray, flatCombinedArray, getGroupedArray, sortGroupedArray } from '@/utils/arrayManaging'
import Progress from '@/components/state/Progress'
import Dropdown from '@/components/selectors/Dropdown'
import DropdownSort from '@/components/selectors/DropdownSort'
import Search from '@/components/Search'
import Toggle from '@/components/Toggle'
import useFoTelemetry from '../../hooks/useFoTelemetry'
import useBaseStore from '@/contexts/useBaseStore'
import VirtuosoCardFO from './_components/VirtuosoCardFO'
import { motion, AnimatePresence } from 'framer-motion'
import BgImage from '@/components/BgImage'
import IconsSection from '@/components/IconsSection'
import { Settings } from 'lucide-react'
import useOsuSearch from '@/lib/osu/hooks/useOsuSearch'
import useSpotifySearch from '@/lib/spotify/hooks/useSpotifySearch'

const MAX_PARALLEL_QUERIES = 100
const ABSOLUTE_MIN_CHUNK_SIZE = 25

export type ListItem = { type: 'group'; key: string } | { type: 'card'; data: CombinedSingleSimple }

export default function FromOsu() {
   const router = useRouter()
   const { songs } = useSongContext()
   useEffect(() => {
      if (!songs.length) router.replace('/from-osu/select')
   }, [songs, router])

   // chunk songs
   const chunkedLocal = useMemo(() => {
      const chunkSize =
         songs.length <= MAX_PARALLEL_QUERIES * ABSOLUTE_MIN_CHUNK_SIZE
            ? ABSOLUTE_MIN_CHUNK_SIZE
            : Math.ceil(songs.length / MAX_PARALLEL_QUERIES)
      console.log(`Using chunk size of ${chunkSize} for ${songs.length} songs.`)
      return chunkArray(songs, chunkSize)
   }, [songs])

   const sortFnName = useBaseStore((state) => state.sortFnName)
   const selectedGroup = useBaseStore((state) => state.selectedGroup)
   const current = useBaseStore((state) => state.current)

   const [exactSpotify, setExactSpotify] = useState(false)
   const [groupFn, setGroupFn] = useState<GroupOptionValue | null>(null)
   const [isSettingsVisible, setIsSettingsVisible] = useState(false)
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
   const [search, setSearch] = useState('')

   useEffect(() => {
      useBaseStore.setState({ current: null })
   }, [exactSpotify, groupFn, sortFnName])

   // queries
   const sp = useSpotifySearch({ chunks: chunkedLocal })
   const osu = useOsuSearch({ chunks: chunkedLocal })
   const isFetching = osu.isFetching || sp.isFetching

   // Combine the arrays
   const combined = chunkedLocal
      .map((localChunk, i) => ({
         local: localChunk,
         spotifyQuery: sp.queries[i],
         osuQuery: osu.queries[i],
      }))
      .flatMap((item) => flatCombinedArray(item))

   const groupedDict = useMemo(() => {
      const extractedData = combined.filter((item) => item.spotify !== null)
      if (isFetching) return { '': extractedData }
      const grouped = getGroupedArray(groupFn, combined)
      return sortGroupedArray(sortFnName, sortOrder, grouped)
   }, [groupFn, sortFnName, sortOrder, combined, isFetching])

   // prepara data for virtuoso
   const virtualListItems = useMemo(() => {
      const items: ListItem[] = []

      for (const group of Object.keys(groupedDict || {})) {
         if (group) items.push({ type: 'group', key: group })

         if (!group || group === selectedGroup) {
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
      spotifyQueries: sp.queries,
      osuQueries: osu.queries,
      songsLength: songs.length,
   })

   const src = useBaseStore((state) => (state.current ? state.current.local.image : undefined))
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
                  <BgImage image={src} className="brightness-[.4]" />
               </motion.div>
            )}
         </AnimatePresence>

         <Progress
            isVisible={isFetching}
            value={
               ((combined.filter((q) => !q.isOsuLoading).length + combined.filter((q) => !q.isSpotifyLoading).length) * 100) /
               (combined.length * 2)
            }
         >
            {osu.msLeft > sp.msLeft
               ? `${osu.queries.filter((q) => !q.isLoading).length}/${songs.length} | ${osu.timeLeft} left`
               : `${sp.queries.filter((q) => !q.isLoading).length}/${songs.length} | ${sp.timeLeft} left`}
         </Progress>

         <header className="bg-triangles [--color-dialog:var(--color-main])] border-b-4 border-main-border w-screen h-12 flex justify-between items-center px-4 gap-3">
            <section className="flex gap-3 items-center min-w-fit">
               <IconsSection>
                  <Settings
                     className={tw(
                        'size-[30px] hover:animate-spin hover:duration-2000 cursor-pointer',
                        isSettingsVisible && 'animate-spin duration-2000',
                     )}
                     onClick={() => setIsSettingsVisible((p) => !p)}
                  />
               </IconsSection>
               <CreatePlaylistButton
                  data={combined.map((item) => item.spotify).filter((item) => item !== null)}
                  dataTotal={songs.length}
               />
            </section>
            <SettingsPopup className={!isSettingsVisible ? '-left-full' : ''} />
            <section className="flex gap-2">
               <Toggle
                  value={exactSpotify}
                  setValue={setExactSpotify}
                  disabled={isFetching} //FIXME?  || !combined.some((i) => i.osu !== null)
                  text={{ on: 'Exact Spotify match', off: 'Any Spotify match' }}
                  width={175}
                  className="max-[1075px]:!hidden"
               />
               <Dropdown
                  onSelected={(option) => {
                     setGroupFn((option?.value as GroupOptionValue) ?? null)
                  }}
                  placeholder="Group by"
                  options={groupOptions}
                  disabled={isFetching}
                  width={100}
               />
               <DropdownSort
                  onSelected={({ query, order }) => {
                     useBaseStore.setState({ sortFnName: query })
                     setSortOrder(order)
                  }}
               />
               <Search value={search} setValue={setSearch} placeholder="Search songs" width={200} disabled={isFetching} />
            </section>
         </header>

         {/* content */}
         <main className="max-h-[calc(100dvh-48px)] flex justify-center sm:justify-end">
            {!virtualListItems.length && !isFetching && (
               <div className="inset-0 absolute flex flex-col items-center gap-4 mt-20 text-white text-2xl font-semibold">
                  No songs found
               </div>
            )}
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
